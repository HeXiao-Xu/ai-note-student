# Build stage
FROM swr.cn-north-4.myhuaweicloud.com/ddn-k8s/docker.io/golang:1.25-alpine AS builder

WORKDIR /app

# Set Go proxy for China network
ENV GOPROXY=https://goproxy.cn,direct

COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN CGO_ENABLED=0 GOOS=linux go build -o /server ./cmd/server

# Runtime stage - use Debian for LibreOffice compatibility
FROM swr.cn-north-4.myhuaweicloud.com/ddn-k8s/docker.io/debian:bookworm-slim

# Install LibreOffice (headless), poppler-utils (pdftotext), Chinese fonts, and other dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
		libreoffice-writer \
		libreoffice-impress \
		poppler-utils \
		fonts-noto-cjk \
		fonts-wqy-zenhei \
		fonts-wqy-microhei \
		ca-certificates \
	&& rm -rf /var/lib/apt/lists/*

ENV TZ=Asia/Shanghai

WORKDIR /app

COPY --from=builder /server ./server
COPY configs/ ./configs/

EXPOSE 8080

CMD ["./server"]
