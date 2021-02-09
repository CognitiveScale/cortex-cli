FROM python:3.7.4-buster
ADD . /app
RUN pip install -r /app/requirements.txt
ENTRYPOINT ["python", "/app/main.py"]
