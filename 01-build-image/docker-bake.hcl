variable "REPO" {
  default = "k33g"
}

variable "TAG" {
  default = "1.24.4_0.0.0"
}

group "default" {
  targets = ["compose-pod"]
}

target "compose-pod" {
  context = "."
  dockerfile = "Dockerfile"
  platforms = [
    "linux/amd64",
    "linux/arm64"
  ]
  tags = ["${REPO}/compose-pod-golang:${TAG}"]
}

# k33g/compose-pod-golang:1.24.0_0.0.0
# docker buildx bake --push --file docker-bake.hcl
# docker buildx bake --file docker-bake.hcl