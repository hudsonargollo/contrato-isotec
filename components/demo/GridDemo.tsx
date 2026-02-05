/**
 * Grid Component Demo
 * Demonstrates the responsive Grid component with various configurations
 */

'use client';

import React from 'react';
import { Grid, GridItem, ResponsiveGrid, AutoGrid, MasonryGrid } from '@/components/ui/grid';
import { Container } from '@/components/ui/container';

// Demo card component for grid items
function DemoCard({ 
  title, 
  content, 
  height = 'auto',
  className = '' 
}: { 
  title: string; 
  content: string; 
  height?: string | number;
  className?: string;
}) {
  const heightStyle = typeof height === 'number' ? { height: `${height}px` } : {};
  
  return (
    <div 
      className={`bg-white border border-neutral-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow duration-200 ${className}`}
      style={heightStyle}
    >
      <h3 className="font-semibold text-neutral-900 mb-2">{title}</h3>
      <p className="text-neutral-600 text-sm">{content}</p>
    </div>
  );
}

export function GridDemo() {
  return (
    <div className="min-h-screen bg-neutral-50 py-8">
      <Container size="xl" padding="lg">
        <div className="space-y-12">
          {/* Header */}
          <div className="text-center">
            <h1 className="text-4xl font-bold text-neutral-900 mb-4">
              Grid Component Demo
            </h1>
            <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
              Responsive grid layouts that adapt to different viewport sizes with configurable spacing and alignment options.
            </p>
          </div>

          {/* Basic Grid */}
          <section>
            <h2 className="text-2xl font-semibold text-neutral-900 mb-6">
              Basic Responsive Grid
            </h2>
            <p className="text-neutral-600 mb-4">
              Default behavior: 1 column on mobile, 2 columns on tablet, 3 columns on desktop
            </p>
            <Grid gap="md">
              <DemoCard 
                title="Card 1" 
                content="This is the first card in our responsive grid. It will stack on mobile and arrange in columns on larger screens." 
              />
              <DemoCard 
                title="Card 2" 
                content="The second card demonstrates how content flows naturally in the grid layout." 
              />
              <DemoCard 
                title="Card 3" 
                content="Third card shows the three-column layout on desktop screens." 
              />
              <DemoCard 
                title="Card 4" 
                content="Additional cards wrap to new rows as needed." 
              />
              <DemoCard 
                title="Card 5" 
                content="The grid maintains consistent spacing and alignment." 
              />
              <DemoCard 
                title="Card 6" 
                content="Perfect for showcasing features, products, or content cards." 
              />
            </Grid>
          </section>

          {/* Custom Column Configuration */}
          <section>
            <h2 className="text-2xl font-semibold text-neutral-900 mb-6">
              Custom Column Configuration
            </h2>
            <p className="text-neutral-600 mb-4">
              Custom responsive behavior: 1 column on mobile, 3 columns on tablet, 4 columns on desktop
            </p>
            <Grid 
              columns={{ mobile: 1, tablet: 3, desktop: 4 }}
              gap="lg"
            >
              <DemoCard title="Feature 1" content="Custom grid configuration allows for precise control over layout." />
              <DemoCard title="Feature 2" content="Perfect for feature grids or product showcases." />
              <DemoCard title="Feature 3" content="Adapts beautifully to different screen sizes." />
              <DemoCard title="Feature 4" content="Maintains visual hierarchy and balance." />
              <DemoCard title="Feature 5" content="Easy to customize for your specific needs." />
              <DemoCard title="Feature 6" content="Consistent spacing and professional appearance." />
              <DemoCard title="Feature 7" content="Works great with any type of content." />
              <DemoCard title="Feature 8" content="Responsive design ensures great UX on all devices." />
            </Grid>
          </section>

          {/* Gap Spacing Variants */}
          <section>
            <h2 className="text-2xl font-semibold text-neutral-900 mb-6">
              Gap Spacing Options
            </h2>
            
            <div className="space-y-8">
              <div>
                <h3 className="text-lg font-medium text-neutral-800 mb-3">Small Gap (8px)</h3>
                <Grid gap="sm" columns={3}>
                  <DemoCard title="Tight" content="Small spacing for compact layouts" />
                  <DemoCard title="Spacing" content="Good for dense information displays" />
                  <DemoCard title="Layout" content="Maximizes content visibility" />
                </Grid>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-neutral-800 mb-3">Large Gap (24px)</h3>
                <Grid gap="lg" columns={3}>
                  <DemoCard title="Spacious" content="Large spacing for breathing room" />
                  <DemoCard title="Layout" content="Creates visual separation" />
                  <DemoCard title="Design" content="Premium, professional appearance" />
                </Grid>
              </div>
            </div>
          </section>

          {/* Grid Item Spanning */}
          <section>
            <h2 className="text-2xl font-semibold text-neutral-900 mb-6">
              Grid Item Spanning
            </h2>
            <p className="text-neutral-600 mb-4">
              Individual grid items can span multiple columns or rows for flexible layouts
            </p>
            <Grid columns={4} gap="md">
              <GridItem span={2}>
                <DemoCard 
                  title="Wide Card" 
                  content="This card spans 2 columns, making it twice as wide as regular cards. Perfect for featured content or important information." 
                  className="h-full"
                />
              </GridItem>
              <DemoCard title="Regular" content="Standard single-column card" />
              <DemoCard title="Regular" content="Another standard card" />
              <GridItem span="full">
                <DemoCard 
                  title="Full Width" 
                  content="This card spans the full width of the grid, creating a banner-like effect. Great for section headers or important announcements." 
                />
              </GridItem>
              <DemoCard title="Normal" content="Back to regular cards" />
              <DemoCard title="Normal" content="Standard layout" />
              <GridItem span={2}>
                <DemoCard 
                  title="Featured" 
                  content="Another wide card for emphasis" 
                  className="h-full"
                />
              </GridItem>
            </Grid>
          </section>

          {/* Responsive Grid Variants */}
          <section>
            <h2 className="text-2xl font-semibold text-neutral-900 mb-6">
              Responsive Grid Variants
            </h2>
            
            <div className="space-y-8">
              <div>
                <h3 className="text-lg font-medium text-neutral-800 mb-3">Gallery Variant (2→3→4 columns)</h3>
                <ResponsiveGrid variant="gallery" gap="sm">
                  <DemoCard title="Image 1" content="Gallery layout for photos" height={120} />
                  <DemoCard title="Image 2" content="Responsive image grid" height={140} />
                  <DemoCard title="Image 3" content="Perfect for portfolios" height={110} />
                  <DemoCard title="Image 4" content="Adapts to screen size" height={130} />
                  <DemoCard title="Image 5" content="Professional presentation" height={125} />
                  <DemoCard title="Image 6" content="Clean and organized" height={135} />
                </ResponsiveGrid>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-neutral-800 mb-3">Stats Variant (2→3→4 columns)</h3>
                <ResponsiveGrid variant="stats" gap="lg">
                  <DemoCard title="1,234" content="Total Users" className="text-center" />
                  <DemoCard title="567" content="Active Projects" className="text-center" />
                  <DemoCard title="89%" content="Success Rate" className="text-center" />
                  <DemoCard title="24/7" content="Support Available" className="text-center" />
                </ResponsiveGrid>
              </div>
            </div>
          </section>

          {/* Auto Grid */}
          <section>
            <h2 className="text-2xl font-semibold text-neutral-900 mb-6">
              Auto-Fit Grid
            </h2>
            <p className="text-neutral-600 mb-4">
              Automatically fits columns based on content width (minimum 250px per column)
            </p>
            <AutoGrid gap="md">
              <DemoCard title="Auto 1" content="Columns automatically adjust based on available space and minimum width constraints." />
              <DemoCard title="Auto 2" content="Perfect for dynamic content where you don't know the exact number of items." />
              <DemoCard title="Auto 3" content="Responsive without media queries - CSS Grid handles the responsiveness." />
              <DemoCard title="Auto 4" content="Great for product grids, team members, or any flexible content." />
              <DemoCard title="Auto 5" content="Maintains consistent spacing and professional appearance." />
            </AutoGrid>
          </section>

          {/* Masonry Grid */}
          <section>
            <h2 className="text-2xl font-semibold text-neutral-900 mb-6">
              Masonry Grid
            </h2>
            <p className="text-neutral-600 mb-4">
              Pinterest-style layout where items flow naturally based on their height
            </p>
            <MasonryGrid gap="md">
              <DemoCard 
                title="Masonry 1" 
                content="This is a shorter card in the masonry layout." 
                height={120}
              />
              <DemoCard 
                title="Masonry 2" 
                content="This card is taller and demonstrates how masonry layout works. Items flow naturally based on their height, creating an organic, Pinterest-style layout that's perfect for content of varying sizes." 
                height={180}
              />
              <DemoCard 
                title="Masonry 3" 
                content="Medium height card that fits nicely in the flow." 
                height={140}
              />
              <DemoCard 
                title="Masonry 4" 
                content="Another short card." 
                height={100}
              />
              <DemoCard 
                title="Masonry 5" 
                content="This is a very tall card that showcases how the masonry layout handles content of different heights. The layout automatically adjusts to create the most visually pleasing arrangement without gaps or awkward spacing." 
                height={220}
              />
              <DemoCard 
                title="Masonry 6" 
                content="Standard height card in the masonry flow." 
                height={160}
              />
              <DemoCard 
                title="Masonry 7" 
                content="Short and sweet." 
                height={90}
              />
              <DemoCard 
                title="Masonry 8" 
                content="The masonry layout is perfect for blogs, portfolios, and any content where items have varying heights." 
                height={170}
              />
            </MasonryGrid>
          </section>

          {/* Alignment Options */}
          <section>
            <h2 className="text-2xl font-semibold text-neutral-900 mb-6">
              Alignment Options
            </h2>
            
            <div className="space-y-8">
              <div>
                <h3 className="text-lg font-medium text-neutral-800 mb-3">Center Aligned</h3>
                <Grid columns={3} gap="md" align="center" justify="center">
                  <DemoCard title="Centered" content="Short content" height={80} />
                  <DemoCard title="Centered" content="This card has more content to demonstrate center alignment with varying heights." height={120} />
                  <DemoCard title="Centered" content="Medium content" height={100} />
                </Grid>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-neutral-800 mb-3">Equal Height (Stretch)</h3>
                <Grid columns={3} gap="md" equalHeight>
                  <DemoCard title="Equal Height" content="Short content" className="h-full" />
                  <DemoCard title="Equal Height" content="This card has more content but all cards will be the same height due to the equalHeight prop." className="h-full" />
                  <DemoCard title="Equal Height" content="Medium content" className="h-full" />
                </Grid>
              </div>
            </div>
          </section>

          {/* Mobile Preview Note */}
          <section className="bg-solar-50 border border-solar-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-solar-800 mb-2">
              📱 Mobile Responsiveness
            </h3>
            <p className="text-solar-700">
              To see the full responsive behavior, try resizing your browser window or viewing this page on different devices. 
              The grids will automatically adapt from single-column layouts on mobile to multi-column layouts on larger screens.
            </p>
          </section>
        </div>
      </Container>
    </div>
  );
}

export default GridDemo;