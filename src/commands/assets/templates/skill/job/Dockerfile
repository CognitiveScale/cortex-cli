FROM c12e/cortex-python-lib:fabric6

COPY --from=redboxoss/scuttle:latest /scuttle /bin/scuttle
ENV ENVOY_ADMIN_API=http://localhost:15000
ENV ISTIO_QUIT_API=http://localhost:15020
ENV SCUTTLE_LOGGING=false

ADD . /app
RUN pip install -r /app/requirements.txt
ENTRYPOINT ["scuttle", "python", "/app/main.py"]
