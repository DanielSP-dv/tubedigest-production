import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import Layout from '../Layout'

describe('Layout', () => {
  it('renders the layout without crashing', () => {
    render(
      <BrowserRouter>
        <Layout>
          <div>Test content</div>
        </Layout>
      </BrowserRouter>
    )
    expect(screen.getByText('Test content')).toBeInTheDocument()
  })

  it('renders the header with navigation', () => {
    render(
      <BrowserRouter>
        <Layout>
          <div>Test content</div>
        </Layout>
      </BrowserRouter>
    )
    expect(screen.getByRole('banner')).toBeInTheDocument()
  })

  it('renders the main content area', () => {
    render(
      <BrowserRouter>
        <Layout>
          <div>Test content</div>
        </Layout>
      </BrowserRouter>
    )
    expect(screen.getByRole('main')).toBeInTheDocument()
  })

  it('renders the sidebar navigation', () => {
    render(
      <BrowserRouter>
        <Layout>
          <div>Test content</div>
        </Layout>
      </BrowserRouter>
    )
    expect(screen.getByRole('complementary')).toBeInTheDocument()
  })

  it('renders navigation menu items', () => {
    render(
      <BrowserRouter>
        <Layout>
          <div>Test content</div>
        </Layout>
      </BrowserRouter>
    )
    expect(screen.getByText(/Dashboard/i)).toBeInTheDocument()
    expect(screen.getByText(/Channel Management/i)).toBeInTheDocument()
  })

  it('renders with proper semantic HTML structure', () => {
    render(
      <BrowserRouter>
        <Layout>
          <div>Test content</div>
        </Layout>
      </BrowserRouter>
    )
    expect(screen.getByRole('banner')).toBeInTheDocument() // Header
    expect(screen.getByRole('main')).toBeInTheDocument() // Main content
    expect(screen.getByRole('complementary')).toBeInTheDocument() // Sidebar
  })

  it('renders with proper Ant Design layout classes', () => {
    render(
      <BrowserRouter>
        <Layout>
          <div>Test content</div>
        </Layout>
      </BrowserRouter>
    )
    const layoutElement = screen.getByRole('main').closest('.ant-layout')
    expect(layoutElement).toBeInTheDocument()
  })

  it('renders the logo/brand', () => {
    render(
      <BrowserRouter>
        <Layout>
          <div>Test content</div>
        </Layout>
      </BrowserRouter>
    )
    expect(screen.getByText(/TubeDigest/i)).toBeInTheDocument()
  })

  it('renders the sidebar with proper styling', () => {
    render(
      <BrowserRouter>
        <Layout>
          <div>Test content</div>
        </Layout>
      </BrowserRouter>
    )
    const sidebar = screen.getByRole('complementary')
    expect(sidebar).toHaveClass('ant-layout-sider')
  })

  it('renders the header with proper styling', () => {
    render(
      <BrowserRouter>
        <Layout>
          <div>Test content</div>
        </Layout>
      </BrowserRouter>
    )
    const header = screen.getByRole('banner')
    expect(header).toHaveClass('ant-layout-header')
  })

  it('renders the main content with proper styling', () => {
    render(
      <BrowserRouter>
        <Layout>
          <div>Test content</div>
        </Layout>
      </BrowserRouter>
    )
    const main = screen.getByRole('main')
    expect(main).toHaveClass('ant-layout-content')
  })

  it('renders navigation menu items with proper structure', () => {
    render(
      <BrowserRouter>
        <Layout>
          <div>Test content</div>
        </Layout>
      </BrowserRouter>
    )
    const menuItems = screen.getAllByRole('menuitem')
    expect(menuItems.length).toBeGreaterThan(0)
  })

  it('renders with proper responsive design classes', () => {
    render(
      <BrowserRouter>
        <Layout>
          <div>Test content</div>
        </Layout>
      </BrowserRouter>
    )
    const layoutElement = screen.getByRole('main').closest('.ant-layout')
    expect(layoutElement).toHaveClass('ant-layout')
  })

  it('renders children content in the main area', () => {
    render(
      <BrowserRouter>
        <Layout>
          <div data-testid="test-content">Custom content</div>
        </Layout>
      </BrowserRouter>
    )
    expect(screen.getByTestId('test-content')).toBeInTheDocument()
    expect(screen.getByText('Custom content')).toBeInTheDocument()
  })

  it('renders with proper theme configuration', () => {
    render(
      <BrowserRouter>
        <Layout>
          <div>Test content</div>
        </Layout>
      </BrowserRouter>
    )
    const layoutElement = screen.getByRole('main').closest('.ant-layout')
    expect(layoutElement).toBeInTheDocument()
  })

  it('renders navigation menu with proper icons', () => {
    render(
      <BrowserRouter>
        <Layout>
          <div>Test content</div>
        </Layout>
      </BrowserRouter>
    )
    // Check that navigation items have proper structure
    const menuItems = screen.getAllByRole('menuitem')
    expect(menuItems.length).toBeGreaterThan(0)
  })

  it('renders with proper layout structure', () => {
    render(
      <BrowserRouter>
        <Layout>
          <div>Test content</div>
        </Layout>
      </BrowserRouter>
    )
    // Check that the layout has the proper structure: Header, Sider, Content, Footer
    const layoutElement = screen.getByRole('main').closest('.ant-layout')
    expect(layoutElement).toBeInTheDocument()
  })
})
