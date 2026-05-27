# Build stage
FROM golang:1.22-alpine AS builder

WORKDIR /app

# Set Go proxy for China network
ENV GOPROXY=https://goproxy.cn,direct

COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN CGO_ENABLED=0 GOOS=linux go build -o /server ./cmd/server

# Runtime stage
FROM alpine:3.19

RUN apk --no-cache add ca-certificates tzdata
ENV TZ=Asia/Shanghai

WORKDIR /app

COPY --from=builder /server ./server
COPY configs/ ./configs/

EXPOSE 8080

CMD ["./server"]
