#!/bin/bash

# Create Python virtual environment
python -m venv venv

# Activate virtual environment
source venv/bin/activate  # On Windows use: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

echo "Backend setup complete!"
echo "To run the backend:"
echo "1. Activate virtual environment: source venv/bin/activate (or venv\Scripts\activate on Windows)"
echo "2. Set up your email credentials in .env file"
echo "3. Run: python main.py"