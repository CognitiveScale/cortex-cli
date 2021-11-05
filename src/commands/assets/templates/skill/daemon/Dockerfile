FROM c12e/cortex-python-lib:fabric6
ADD . /app
WORKDIR /app
RUN pip install -r requirements.txt

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "5000", "--workers", "2"]
