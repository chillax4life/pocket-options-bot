import sys
from pathlib import Path
from loguru import logger
import yaml


def setup_logging(config_path: str = "config.yaml"):
    """
    Configure loguru logger based on config.yaml settings
    """
    # Load configuration
    config_file = Path(config_path)
    if config_file.exists():
        with open(config_file, 'r') as f:
            config = yaml.safe_load(f)
        log_config = config.get('logging', {})
    else:
        log_config = {}
    
    # Extract logging settings with defaults
    log_level = log_config.get('level', 'INFO')
    log_file = log_config.get('file', 'logs/bot.log')
    max_size_mb = log_config.get('max_size_mb', 10)
    backup_count = log_config.get('backup_count', 5)
    
    # Remove default logger
    logger.remove()
    
    # Add console logger with color
    logger.add(
        sys.stdout,
        format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>",
        level=log_level,
        colorize=True
    )
    
    # Ensure log directory exists
    log_path = Path(log_file)
    log_path.parent.mkdir(parents=True, exist_ok=True)
    
    # Add file logger with rotation
    logger.add(
        log_file,
        format="{time:YYYY-MM-DD HH:mm:ss} | {level: <8} | {name}:{function}:{line} - {message}",
        level=log_level,
        rotation=f"{max_size_mb} MB",
        retention=backup_count,
        compression="zip"
    )
    
    logger.info(f"Logging initialized: level={log_level}, file={log_file}")
    return logger


def get_logger(name: str = __name__):
    """
    Get a logger instance for a specific module
    """
    return logger.bind(name=name)
