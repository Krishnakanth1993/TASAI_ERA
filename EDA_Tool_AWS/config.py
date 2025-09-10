import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class Config:
    """Configuration class for the EDA Tool"""
    
    # Flask configuration
    SECRET_KEY = os.environ.get('SECRET_KEY', 'eda_tool_secret_key_2024')
    MAX_CONTENT_LENGTH = 100 * 1024 * 1024  # 100MB limit
    
    # Gemini API configuration
    GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY')
    GEMINI_MODEL = os.environ.get('GEMINI_MODEL', 'gemini-1.5-flash')
    
    # Upload configuration
    UPLOAD_FOLDER = 'temp_uploads'
    
    # Supported file extensions
    ALLOWED_EXTENSIONS = {'csv', 'xlsx', 'xls'}
    
    @staticmethod
    def validate_config():
        """Validate that required configuration is present"""
        if not Config.GEMINI_API_KEY:
            print("Warning: GEMINI_API_KEY not found in environment variables")
            print("LLM-based cleaning recommendations will be disabled")
            return False
        return True
