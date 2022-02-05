FROM python:3.7.4-buster
COPY --from=redboxoss/scuttle:latest /scuttle /bin/scuttle
ENV ENVOY_ADMIN_API=http://localhost:15000
ENV ISTIO_QUIT_API=http://localhost:15020

ADD . /app
RUN pip install -r /app/requirements.txt
ENTRYPOINT ["scuttle", "python", "/app/main.py"]
