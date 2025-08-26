# Security Architecture

## **Frontend Security**
```typescript
// JWT token management
class TokenManager {
  private static readonly TOKEN_KEY = 'tubedigest_token';
  private static readonly REFRESH_KEY = 'tubedigest_refresh';
  
  static getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }
  
  static setTokens(token: string, refreshToken: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
    localStorage.setItem(this.REFRESH_KEY, refreshToken);
  }
  
  static clearTokens(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_KEY);
  }
  
  static isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 < Date.now();
    } catch {
      return true;
    }
  }
}

// API client with automatic token refresh
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
});

api.interceptors.request.use((config) => {
  const token = TokenManager.getToken();
  if (token && !TokenManager.isTokenExpired(token)) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const refreshToken = localStorage.getItem('tubedigest_refresh');
      if (refreshToken) {
        try {
          const response = await axios.post('/auth/refresh', { refreshToken });
          const { token, refreshToken: newRefreshToken } = response.data;
          TokenManager.setTokens(token, newRefreshToken);
          
          // Retry original request
          error.config.headers.Authorization = `Bearer ${token}`;
          return axios.request(error.config);
        } catch (refreshError) {
          TokenManager.clearTokens();
          window.location.href = '/login';
        }
      } else {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);
```

## **Email Security**
```typescript
// Signed URLs for email actions
@Injectable()
export class EmailSecurityService {
  constructor(private readonly configService: ConfigService) {}
  
  generateSaveToWatchLaterUrl(videoId: string, digestId: string, userId: string): string {
    const payload = {
      action: 'save_to_watch_later',
      videoId,
      digestId,
      userId,
      exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60), // 7 days
    };
    
    const token = jwt.sign(payload, this.configService.get('JWT_SECRET'));
    return `${this.configService.get('FRONTEND_URL')}/api/email-actions/save?token=${token}`;
  }
  
  generateWebViewUrl(digestId: string): string {
    const token = jwt.sign(
      { digestId, exp: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60) }, // 30 days
      this.configService.get('JWT_SECRET')
    );
    return `${this.configService.get('FRONTEND_URL')}/digest/${digestId}?token=${token}`;
  }
  
  @Post('email-actions/save')
  async handleSaveFromEmail(@Query('token') token: string): Promise<{ success: boolean }> {
    try {
      const payload = jwt.verify(token, this.configService.get('JWT_SECRET')) as any;
      
      if (payload.action !== 'save_to_watch_later') {
        throw new UnauthorizedException('Invalid action');
      }
      
      await this.watchLaterService.saveItem(payload.userId, payload.videoId, payload.digestId);
      
      return { success: true };
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
```
