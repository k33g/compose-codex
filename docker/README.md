https://docs.docker.com/extensions/extensions-sdk/build/backend-extension-tutorial/


## Initialize the extension

```bash
docker extension init compose-codex
```


We suggest that you begin by typing:

```bash
  cd compose-codex
  docker build -t philippecharriere494/compose-codex:latest .
  docker extension install philippecharriere494/compose-codex:latest
```

or use the targets defined in the Makefile. Then, open Docker Desktop and navigate to your extension.
Extension containers are hidden from the Docker Dashboard by default. You can change this in Settings > Extensions > Show Docker Extensions system containers.

To learn more about how to build your extension refer to the Extension SDK docs at https://docs.docker.com/desktop/extensions-sdk/.
To publish your extension in the Marketplace visit https://www.docker.com/products/extensions/submissions/.
To report issues and feedback visit https://github.com/docker/extensions-sdk/issues.