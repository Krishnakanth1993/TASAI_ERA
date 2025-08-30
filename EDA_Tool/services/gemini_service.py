import google.generativeai as genai
import json
import logging
from typing import Dict, Any, Optional
from config import Config

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class GeminiService:
    """Service class for interacting with Google Gemini API"""
    
    def __init__(self):
        """Initialize Gemini service with API key"""
        if not Config.GEMINI_API_KEY:
            raise ValueError("GEMINI_API_KEY not configured")
        
        # Configure Gemini API - Fixed indentation
        genai.configure(api_key=Config.GEMINI_API_KEY)
        self.model = genai.GenerativeModel(Config.GEMINI_MODEL)
        
    def get_cleaning_recommendations(self, data_stats: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Get data cleaning recommendations from Gemini based on data statistics
        
        Args:
            data_stats: Dictionary containing data analysis statistics
            
        Returns:
            Dictionary with cleaning recommendations or None if failed
        """
        try:
            # Create a comprehensive prompt for data cleaning recommendations
            prompt = self._create_cleaning_prompt(data_stats)
            
            # Generate response from Gemini
            response = self.model.generate_content(prompt)
            
            # Parse the response
            recommendations = self._parse_gemini_response(response.text)
            
            logger.info("Successfully generated cleaning recommendations")
            return recommendations
            
        except Exception as e:
            logger.error(f"Error getting cleaning recommendations: {str(e)}")
            return None
    
    def _create_cleaning_prompt(self, data_stats: Dict[str, Any]) -> str:
        """Create a comprehensive prompt for data cleaning recommendations"""
        
        # CUSTOMIZE YOUR LLM QUERY HERE
        prompt = f"""
You are a data science expert specializing in data cleaning and preprocessing. 
Analyze the following dataset statistics and provide specific, actionable recommendations for data cleaning.

Dataset Statistics:
{json.dumps(data_stats, indent=2)}

Please provide recommendations in the following JSON format:
{{
    "summary": "Brief summary of main data quality issues",
    "critical_issues": [
        {{
            "issue": "Description of the issue",
            "severity": "high/medium/low",
            "impact": "How this affects analysis",
            "recommendation": "Specific action to take"
        }}
    ],
    "cleaning_steps": [
        {{
            "step": "Step number",
            "action": "Specific cleaning action",
            "columns": ["column1", "column2"],
            "method": "How to perform this action",
            "priority": "high/medium/low",
            "expected_outcome": "What this will improve"
        }}
    ],
    "data_quality_score": "percentage (0-100)",
    "next_steps": "What to do after cleaning"
}}

Focus on:
1. Missing value handling
2. Outlier detection and treatment
3. Data type conversions
4. Duplicate removal
5. Data consistency issues
6. Statistical anomalies

Provide practical, implementable recommendations that a data scientist can follow.
Use bullet points and be concise summary.Use icons to make it more engaging.
"""
        return prompt
    
    def _parse_gemini_response(self, response_text: str) -> Optional[Dict[str, Any]]:
        """Parse Gemini response and extract JSON recommendations"""
        try:
            # Try to find JSON in the response
            start_idx = response_text.find('{')
            end_idx = response_text.rfind('}') + 1
            
            if start_idx == -1 or end_idx == 0:
                logger.warning("No JSON found in Gemini response")
                return None
            
            json_str = response_text[start_idx:end_idx]
            recommendations = json.loads(json_str)
            
            # Validate the structure
            required_keys = ['summary', 'critical_issues', 'cleaning_steps', 'data_quality_score', 'next_steps']
            if all(key in recommendations for key in required_keys):
                return recommendations
            else:
                logger.warning("Incomplete recommendations structure from Gemini")
                return None
                
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse JSON from Gemini response: {str(e)}")
            return None
        except Exception as e:
            logger.error(f"Error parsing Gemini response: {str(e)}")
            return None
