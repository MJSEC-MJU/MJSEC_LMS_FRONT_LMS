# ---------- 1) Build stage ----------
FROM node:20-alpine AS build
WORKDIR /app

# 의존성 설치
COPY package*.json ./
RUN npm ci

# 소스 복사 후 빌드
COPY . .
# (선택) 빌드 타임 API 베이스 바꾸고 싶으면 아래 ARG/ENV 사용
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
