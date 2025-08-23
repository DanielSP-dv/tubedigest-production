import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import VideoCard from './VideoCard'

const mockVideo = {
  id: '1',
  title: 'Test Video',
  channel: 'Test Channel',
  summary: 'This is a test summary for the video.',
  chapters: [
    { title: 'Introduction', startTime: 0 },
    { title: 'Main Content', startTime: 120 },
    { title: 'Conclusion', startTime: 300 }
  ],
  thumbnail: 'test-thumbnail.jpg',
  url: 'https://youtube.com/watch?v=test',
  duration: 360,
  publishedAt: '2025-08-15T10:00:00Z'
}

describe('VideoCard', () => {
  it('renders video title and channel', () => {
    render(<VideoCard video={mockVideo} />)
    
    expect(screen.getByText('Test Video')).toBeInTheDocument()
    expect(screen.getByText('Test Channel')).toBeInTheDocument()
  })

  it('renders video summary', () => {
    render(<VideoCard video={mockVideo} />)
    
    expect(screen.getByText('This is a test summary for the video.')).toBeInTheDocument()
  })

  it('renders chapters', () => {
    render(<VideoCard video={mockVideo} />)
    
    expect(screen.getByText('Chapters (3):')).toBeInTheDocument()
    expect(screen.getByText('0m - Introduction')).toBeInTheDocument()
    expect(screen.getByText('2m - Main Content')).toBeInTheDocument()
    expect(screen.getByText('5m - Conclusion')).toBeInTheDocument()
  })

  it('displays correct duration format', () => {
    render(<VideoCard video={mockVideo} />)
    
    expect(screen.getByText('6:00')).toBeInTheDocument()
  })

  it('displays published date correctly', () => {
    render(<VideoCard video={mockVideo} />)
    
    expect(screen.getByText(/Published/)).toBeInTheDocument()
    expect(screen.getByText(/8\/15\/2025/)).toBeInTheDocument()
  })

  it('calls onWatch when Watch button is clicked', () => {
    const mockOnWatch = vi.fn()
    render(<VideoCard video={mockVideo} onWatch={mockOnWatch} />)
    
    const watchButton = screen.getByRole('button', { name: /watch test video/i })
    fireEvent.click(watchButton)
    
    expect(mockOnWatch).toHaveBeenCalledWith('1')
  })

  it('calls onSave when Save button is clicked', () => {
    const mockOnSave = vi.fn()
    render(<VideoCard video={mockVideo} onSave={mockOnSave} />)
    
    const saveButton = screen.getByRole('button', { name: /save test video/i })
    fireEvent.click(saveButton)
    
    expect(mockOnSave).toHaveBeenCalledWith('1')
  })

  it('shows Saved state when isSaved is true', () => {
    render(<VideoCard video={mockVideo} isSaved={true} />)
    
    expect(screen.getByRole('button', { name: /remove test video from saved/i })).toBeInTheDocument()
    expect(screen.getByText('Saved')).toBeInTheDocument()
  })

  it('handles videos with no chapters gracefully', () => {
    const videoWithoutChapters = { ...mockVideo, chapters: [] }
    render(<VideoCard video={videoWithoutChapters} />)
    
    expect(screen.queryByText('Chapters (0):')).not.toBeInTheDocument()
  })

  it('handles videos with many chapters by showing only first 3', () => {
    const videoWithManyChapters = {
      ...mockVideo,
      chapters: [
        { title: 'Chapter 1', startTime: 0 },
        { title: 'Chapter 2', startTime: 60 },
        { title: 'Chapter 3', startTime: 120 },
        { title: 'Chapter 4', startTime: 180 },
        { title: 'Chapter 5', startTime: 240 }
      ]
    }
    render(<VideoCard video={videoWithManyChapters} />)
    
    expect(screen.getByText('Chapters (5):')).toBeInTheDocument()
    expect(screen.getByText('0m - Chapter 1')).toBeInTheDocument()
    expect(screen.getByText('1m - Chapter 2')).toBeInTheDocument()
    expect(screen.getByText('2m - Chapter 3')).toBeInTheDocument()
    expect(screen.getByText('+2 more')).toBeInTheDocument()
  })

  it('formats long durations correctly', () => {
    const longVideo = { ...mockVideo, duration: 7325 } // 2h 2m 5s
    render(<VideoCard video={longVideo} />)
    
    expect(screen.getByText('2:02:05')).toBeInTheDocument()
  })

  it('has proper accessibility attributes', () => {
    render(<VideoCard video={mockVideo} />)
    
    const watchButton = screen.getByRole('button', { name: /watch test video/i })
    const saveButton = screen.getByRole('button', { name: /save test video/i })
    
    expect(watchButton).toHaveAttribute('aria-label', 'Watch Test Video')
    expect(watchButton).toHaveAttribute('title', 'Watch Test Video')
    expect(saveButton).toHaveAttribute('aria-label', 'Save Test Video')
    expect(saveButton).toHaveAttribute('title', 'Save Test Video')
  })
})
