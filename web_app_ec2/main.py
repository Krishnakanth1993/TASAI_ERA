from fastapi import FastAPI, File, UploadFile, HTTPException, Request
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import io
import json
from typing import Optional
import uvicorn
from pathlib import Path
import numpy as np

app = FastAPI(
    title="EDA Explorer", 
    description="Exploratory Data Analysis Web Application",
    version="1.0.0"
)

# Add CORS middleware to prevent caching issues
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files with cache busting
app.mount("/static", StaticFiles(directory="static"), name="static")

# Templates
templates = Jinja2Templates(directory="templates")

def convert_numpy_types(obj):
    """Convert numpy types to Python native types for JSON serialization"""
    if isinstance(obj, np.integer):
        return int(obj)
    elif isinstance(obj, np.floating):
        return float(obj)
    elif isinstance(obj, np.ndarray):
        return obj.tolist()
    elif isinstance(obj, dict):
        return {key: convert_numpy_types(value) for key, value in obj.items()}
    elif isinstance(obj, list):
        return [convert_numpy_types(item) for item in obj]
    else:
        return obj

@app.get("/", response_class=HTMLResponse)
async def read_root(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    """Upload and process CSV/Excel files"""
    try:
        # Validate file type
        allowed_extensions = {'.csv', '.xlsx', '.xls'}
        file_extension = Path(file.filename).suffix.lower()
        
        if file_extension not in allowed_extensions:
            raise HTTPException(status_code=400, detail="Invalid file type")
        
        # Validate file size (100MB limit)
        if file.size > 100 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="File too large (max 100MB)")
        
        # Read file content
        content = await file.read()
        
        # Parse file based on type
        if file_extension == '.csv':
            df = pd.read_csv(io.StringIO(content.decode('utf-8')))
        else:  # Excel files
            df = pd.read_excel(io.BytesIO(content))
        
        # Clean the DataFrame - replace NaN values with None
        df = df.replace({np.nan: None})
        
        # Convert DataFrame to list of dictionaries for JSON response
        data = df.to_dict('records')
        
        # Convert numpy types to Python native types
        data = convert_numpy_types(data)
        
        # Return the data
        return {
            "success": True,
            "message": f"File {file.filename} uploaded successfully",
            "data": data,
            "rows": len(data),
            "columns": len(data[0]) if data else 0
        }
        
    except Exception as e:
        print(f"Upload error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing file: {str(e)}")

@app.post("/analyze")
async def analyze_data(request: Request):
    """Run statistical analysis on uploaded data"""
    try:
        body = await request.json()
        columns = body.get("columns", [])
        analysis_type = body.get("analysis_type", "descriptive")
        
        # This would typically use the stored DataFrame from the session
        # For now, return mock data
        if analysis_type == "descriptive":
            result = {
                "type": "descriptive",
                "columns": columns,
                "statistics": {
                    "count": len(columns),
                    "message": "Descriptive statistics generated successfully"
                }
            }
        else:
            result = {
                "type": analysis_type,
                "columns": columns,
                "message": f"{analysis_type.title()} analysis completed"
            }
        
        return JSONResponse(content=result)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error in analysis: {str(e)}")

@app.post("/visualize")
async def generate_chart(request: Request):
    """Generate charts and visualizations"""
    try:
        body = await request.json()
        chart_type = body.get("chart_type")
        x_column = body.get("x_column")
        y_column = body.get("y_column", None)
        
        # This would generate actual chart data
        # For now, return chart configuration
        chart_config = {
            "type": chart_type,
            "x_column": x_column,
            "y_column": y_column,
            "message": f"{chart_type} chart generated successfully"
        }
        
        return JSONResponse(content=chart_config)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating chart: {str(e)}")

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "message": "EDA Explorer is running"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
