# ---------- 1) Build stage ----------
FROM node:20-alpine AS build
WORKDIR /app

# (★) Vite용 빌드타임 변수 받기
# 필요한 만큼 추가하면 됨 (예: 다른 apikey도 같은 패턴으로)
ARG VITE_API_BASE
ARG VITE_TINYMCE_API_KEY
# ARG VITE_MY_SERVICE_API_KEY   # ← "다른 apikey"를 쓸 거면 이런 식으로 추가

# (★) ENV로 노출해 Vite 빌드에서 import.meta.env로 읽히게 함
ENV VITE_API_BASE=${VITE_API_BASE}
ENV VITE_TINYMCE_API_KEY=${VITE_TINYMCE_API_KEY}
# ENV VITE_MY_SERVICE_API_KEY=${VITE_MY_SERVICE_API_KEY}

# 의존성 설치
COPY package*.json ./
RUN npm ci

# 소스 복사 후 빌드
COPY . .
# (선택) 기본값 강제하고 싶으면 Docker build-arg 기본값도 가능
# ARG VITE_API_BASE=/lms/api
# ENV VITE_API_BASE=${VITE_API_BASE}
RUN npm run build   # vite.config에서 base:'/lms/' 라고 가정 → dist/

# ---------- 2) Runtime stage ----------
FROM nginx:1.27-alpine AS runtime

# 기본 툴(헬스체크용)
RUN apk add --no-cache curl

# Nginx 설정 주입 (SPA fallback/캐시/보안 헤더)
COPY deploy/nginx/default.conf /etc/nginx/conf.d/default.conf

# 정적 파일 복사
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD curl -fsS http://localhost/ >/dev/null || exit 1

CMD ["nginx", "-g", "daemon off;"]
