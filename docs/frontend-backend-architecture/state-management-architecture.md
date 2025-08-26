# State Management Architecture

## **React Query + Zustand Pattern**
```typescript
// API layer with React Query
export const digestQueries = {
  latest: () => ({
    queryKey: ['digest', 'latest'],
    queryFn: () => api.get('/digests/latest').then(res => res.data),
    staleTime: 5 * 60 * 1000, // 5 minutes
  }),
  
  archive: (page: number, limit: number) => ({
    queryKey: ['digest', 'archive', page, limit],
    queryFn: () => api.get(`/digests/archive?page=${page}&limit=${limit}`).then(res => res.data),
  }),
};

export const watchLaterQueries = {
  list: (filters: WatchLaterFilters) => ({
    queryKey: ['watchLater', 'list', filters],
    queryFn: () => api.get('/watch-later', { params: filters }).then(res => res.data),
  }),
  
  stats: () => ({
    queryKey: ['watchLater', 'stats'],
    queryFn: () => api.get('/watch-later/stats').then(res => res.data),
  }),
};

// Global state with Zustand
interface AppStore {
  // Auth state
  user: User | null;
  isAuthenticated: boolean;
  
  // UI state
  sidebarCollapsed: boolean;
  theme: 'light' | 'dark';
  
  // Actions
  setUser: (user: User | null) => void;
  toggleSidebar: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
}

export const useAppStore = create<AppStore>((set) => ({
  user: null,
  isAuthenticated: false,
  sidebarCollapsed: false,
  theme: 'light',
  
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setTheme: (theme) => set({ theme }),
}));

// Custom hooks for data fetching
export function useLatestDigest() {
  return useQuery(digestQueries.latest());
}

export function useWatchLater(filters: WatchLaterFilters = {}) {
  return useQuery(watchLaterQueries.list(filters));
}

export function useSaveToWatchLater() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (videoId: string) => api.post('/watch-later', { videoId }),
    onSuccess: () => {
      // Invalidate watch later queries
      queryClient.invalidateQueries(['watchLater']);
      
      // Show success notification
      notification.success({
        message: 'Saved to Watch Later',
        description: 'Video has been added to your Watch Later list',
        duration: 3,
      });
    },
    onError: (error) => {
      notification.error({
        message: 'Failed to save',
        description: 'Could not add video to Watch Later. Please try again.',
      });
    },
  });
}
```
