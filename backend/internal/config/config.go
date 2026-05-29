package config

import (
	"fmt"
	"os"

	"gopkg.in/yaml.v3"
)

type Config struct {
	Server   ServerConfig   `yaml:"server"`
	Database DatabaseConfig `yaml:"database"`
	JWT      JWTConfig      `yaml:"jwt"`
	MinIO    MinIOConfig    `yaml:"minio"`
	OCR      OCRConfig      `yaml:"ocr"`
	LLM      LLMConfig      `yaml:"llm"`
}

type MinIOConfig struct {
	Endpoint  string `yaml:"endpoint"`
	AccessKey string `yaml:"access_key"`
	SecretKey string `yaml:"secret_key"`
	Bucket    string `yaml:"bucket"`
	UseSSL    bool   `yaml:"use_ssl"`
}

type OCRConfig struct {
	Provider string         `yaml:"provider"`
	Baidu    BaiduOCRConfig `yaml:"baidu"`
	Mathpix  MathpixConfig  `yaml:"mathpix"`
}

type BaiduOCRConfig struct {
	APIKey    string `yaml:"api_key"`
	SecretKey string `yaml:"secret_key"`
}

type MathpixConfig struct {
	AppID string `yaml:"app_id"`
	AppKey string `yaml:"app_key"`
}

type ServerConfig struct {
	Port string `yaml:"port"`
}

type DatabaseConfig struct {
	Host     string `yaml:"host"`
	Port     string `yaml:"port"`
	User     string `yaml:"user"`
	Password string `yaml:"password"`
	DBName   string `yaml:"dbname"`
	SSLMode  string `yaml:"sslmode"`
}

type JWTConfig struct {
	Secret     string `yaml:"secret"`
	ExpiryHour int    `yaml:"expiry_hour"`
}

type LLMConfig struct {
	Provider  string          `yaml:"provider"`
	Zhipu     ZhipuConfig     `yaml:"zhipu"`
	OpenAI    OpenAIConfig    `yaml:"openai"`
	DashScope DashScopeConfig `yaml:"dashscope"`
}

type ZhipuConfig struct {
	APIKey string `yaml:"api_key"`
	Model  string `yaml:"model"`
}

type OpenAIConfig struct {
	APIKey  string `yaml:"api_key"`
	BaseURL string `yaml:"base_url"`
	Model   string `yaml:"model"`
}

type DashScopeConfig struct {
	APIKey string `yaml:"api_key"`
	Model  string `yaml:"model"`
}

func (d *DatabaseConfig) DSN() string {
	return fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=%s sslmode=%s",
		d.Host, d.Port, d.User, d.Password, d.DBName, d.SSLMode,
	)
}

func Load(path string) (*Config, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, fmt.Errorf("read config file: %w", err)
	}

	var cfg Config
	if err := yaml.Unmarshal(data, &cfg); err != nil {
		return nil, fmt.Errorf("parse config file: %w", err)
	}

	// Override with environment variables (for dev mode where DB is on localhost)
	if v := os.Getenv("DB_HOST"); v != "" {
		cfg.Database.Host = v
	}
	if v := os.Getenv("DB_PORT"); v != "" {
		cfg.Database.Port = v
	}
	if v := os.Getenv("DB_PASSWORD"); v != "" {
		cfg.Database.Password = v
	}
	if v := os.Getenv("JWT_SECRET"); v != "" {
		cfg.JWT.Secret = v
	}
	if v := os.Getenv("MINIO_ENDPOINT"); v != "" {
		cfg.MinIO.Endpoint = v
	}
	if v := os.Getenv("MINIO_ACCESS_KEY"); v != "" {
		cfg.MinIO.AccessKey = v
	}
	if v := os.Getenv("MINIO_SECRET_KEY"); v != "" {
		cfg.MinIO.SecretKey = v
	}
	if v := os.Getenv("BAIDU_OCR_API_KEY"); v != "" {
		cfg.OCR.Baidu.APIKey = v
	}
	if v := os.Getenv("BAIDU_OCR_SECRET_KEY"); v != "" {
		cfg.OCR.Baidu.SecretKey = v
	}
	if v := os.Getenv("MATHPIX_APP_ID"); v != "" {
		cfg.OCR.Mathpix.AppID = v
	}
	if v := os.Getenv("MATHPIX_APP_KEY"); v != "" {
		cfg.OCR.Mathpix.AppKey = v
	}
	if v := os.Getenv("LLM_PROVIDER"); v != "" {
		cfg.LLM.Provider = v
	}
	if v := os.Getenv("ZHIPU_API_KEY"); v != "" {
		cfg.LLM.Zhipu.APIKey = v
	}
	if v := os.Getenv("ZHIPU_MODEL"); v != "" {
		cfg.LLM.Zhipu.Model = v
	}
	if v := os.Getenv("OPENAI_API_KEY"); v != "" {
		cfg.LLM.OpenAI.APIKey = v
	}
	if v := os.Getenv("OPENAI_BASE_URL"); v != "" {
		cfg.LLM.OpenAI.BaseURL = v
	}
	if v := os.Getenv("OPENAI_MODEL"); v != "" {
		cfg.LLM.OpenAI.Model = v
	}
	if v := os.Getenv("DASHSCOPE_API_KEY"); v != "" {
		cfg.LLM.DashScope.APIKey = v
	}
	if v := os.Getenv("DASHSCOPE_MODEL"); v != "" {
		cfg.LLM.DashScope.Model = v
	}

	return &cfg, nil
}
