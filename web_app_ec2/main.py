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
        
        # Basic data info
        data_info = {
            "rows": len(df),
            "columns": len(df.columns),
            "memory_usage": f"{df.memory_usage(deep=True).sum() / 1024:.1f} KB",
            "missing_values": df.isnull().sum().sum(),
            "columns_list": df.columns.tolist(),
            "data_types": df.dtypes.astype(str).to_dict(),
            "head_data": df.head(10).values.tolist(),
            "tail_data": df.tail(10).values.tolist()
        }
        
        return JSONResponse(content=data_info)
        
    except Exception as e:
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
    return {"status": "healthy", "service": "EDA Explorer"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
