FROM python:3.7.4-buster
ADD . /app
RUN pip install -r /app/requirements.txt
CMD ["uvicorn", "__main__:app", "--host", "0.0.0.0", "--port", "5000", "--workers", "2"]
