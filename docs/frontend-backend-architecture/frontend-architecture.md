# Frontend Architecture

## **Technology Stack**
```json
{
  "framework": "React 18+",
  "uiLibrary": "Ant Design 5.x",
  "language": "TypeScript",
  "bundler": "Vite",
  "stateManagement": "React Query + Zustand",
  "routing": "React Router v6",
  "testing": "Jest + React Testing Library",
  "styling": "CSS Modules + Ant Design tokens"
}
```

## **Project Structure**
```
frontend/
├── src/
│   ├── components/
│   │   ├── atoms/           # Basic Ant Design wrappers
│   │   ├── molecules/       # Video cards, search bars
│   │   ├── organisms/       # Digest grids, navigation
│   │   └── templates/       # Page layouts
│   ├── pages/
│   │   ├── Dashboard.tsx    # Latest digest view
│   │   ├── WatchLater.tsx   # Saved videos
│   │   ├── Settings.tsx     # User preferences
│   │   └── Auth/            # OAuth flow
│   ├── hooks/
│   │   ├── useAuth.ts       # Authentication state
│   │   ├── useDigest.ts     # Digest data fetching
│   │   └── useWatchLater.ts # Watch later management
│   ├── services/
│   │   ├── api.ts           # API client configuration
│   │   ├── auth.ts          # Auth service
│   │   └── types.ts         # TypeScript interfaces
│   ├── styles/
│   │   ├── antd-theme.ts    # Ant Design customization
│   │   └── globals.css      # Global styles
│   └── utils/
│       ├── formatters.ts    # Date, time formatting
│       └── constants.ts     # App constants
├── public/
│   ├── index.html
│   └── favicon.ico
└── package.json
```

## **Component Architecture with Ant Design**

### **Core Components Mapping**
```typescript
// VideoCard - Primary content component
interface VideoCardProps {
  video: {
    id: string;
    title: string;
    channelName: string;
    summaryParagraphs: string[];
    chapters: Chapter[];
    thumbnail: string;
    duration: number;
    publishedAt: string;
  };
  onSave: (videoId: string) => Promise<void>;
  onWatch: (videoUrl: string) => void;
  isSaved?: boolean;
  layout?: 'grid' | 'list' | 'email';
}

// Using Ant Design Card as base
const VideoCard: React.FC<VideoCardProps> = ({ video, onSave, onWatch, isSaved, layout = 'grid' }) => {
  return (
    <Card
      hoverable
      cover={<img alt={video.title} src={video.thumbnail} />}
      actions={[
        <Button 
          type="primary" 
          icon={<PlayCircleOutlined />}
          onClick={() => onWatch(video.youtubeUrl)}
        >
          Watch
        </Button>,
        <Button 
          icon={isSaved ? <StarFilled /> : <StarOutlined />}
          onClick={() => onSave(video.id)}
          loading={savingState === video.id}
        >
          {isSaved ? 'Saved' : 'Save'}
        </Button>
      ]}
    >
      <Card.Meta
        title={video.title}
        description={
          <div className="video-content">
            <div className="channel-info">
              <Text type="secondary">{video.channelName}</Text>
              <Text type="secondary"> • {formatTimeAgo(video.publishedAt)}</Text>
            </div>
            
            <div className="summary">
              {video.summaryParagraphs.map((paragraph, index) => (
                <Paragraph key={index}>{paragraph}</Paragraph>
              ))}
            </div>
            
            <Collapse ghost>
              <Panel header={`Chapters (${video.chapters.length})`} key="1">
                <List
                  size="small"
                  dataSource={video.chapters.slice(0, 10)}
                  renderItem={(chapter) => (
                    <List.Item>
                      <Text code>{formatTimestamp(chapter.startTime)}</Text>
                      <Text>{chapter.title}</Text>
                    </List.Item>
                  )}
                />
                {video.chapters.length > 10 && (
                  <Button type="link">View all {video.chapters.length} chapters</Button>
                )}
              </Panel>
            </Collapse>
          </div>
        }
      />
    </Card>
  );
};
```

### **Dashboard Layout**
```typescript
// Main dashboard using Ant Design Layout
const DashboardLayout: React.FC = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Layout.Header>
        <div className="logo">
          <img src="/logo.svg" alt="TubeDigest" />
        </div>
        <Menu mode="horizontal" defaultSelectedKeys={['latest']}>
          <Menu.Item key="latest" icon={<MailOutlined />}>
            Latest Digest
          </Menu.Item>
          <Menu.Item key="watchlater" icon={<StarOutlined />}>
            Watch Later
          </Menu.Item>
          <Menu.Item key="search" icon={<SearchOutlined />}>
            Search
          </Menu.Item>
          <Menu.Item key="settings" icon={<SettingOutlined />}>
            Settings
          </Menu.Item>
        </Menu>
        <UserMenu />
      </Layout.Header>
      
      <Layout.Content style={{ padding: '24px', margin: 0 }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          {children}
        </div>
      </Layout.Content>
    </Layout>
  );
};

// Latest Digest View
const LatestDigestPage: React.FC = () => {
  const { data: digest, isLoading } = useQuery(['digest', 'latest'], getLatestDigest);
  
  if (isLoading) return <Skeleton active />;
  
  return (
    <div>
      <PageHeader
        title={`Today's Digest - ${format(new Date(), 'MMMM do, yyyy')}`}
        subTitle={`${digest.items.length} videos from ${digest.channelCount} channels`}
      />
      
      <Row gutter={[16, 16]}>
        {digest.items.map((video) => (
          <Col xs={24} sm={12} lg={8} key={video.id}>
            <VideoCard
              video={video}
              onSave={saveToWatchLater}
              onWatch={openYouTubeVideo}
              isSaved={watchLaterIds.includes(video.id)}
            />
          </Col>
        ))}
      </Row>
    </div>
  );
};
```
