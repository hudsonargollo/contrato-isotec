/**
 * Grid Component Tests
 * Tests for the responsive Grid component and its variants
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Grid, GridItem, ResponsiveGrid, AutoGrid, MasonryGrid } from '@/components/ui/grid';

describe('Grid Component', () => {
  describe('Basic Grid', () => {
    it('renders children correctly', () => {
      render(
        <Grid>
          <div>Item 1</div>
          <div>Item 2</div>
          <div>Item 3</div>
        </Grid>
      );

      expect(screen.getByText('Item 1')).toBeInTheDocument();
      expect(screen.getByText('Item 2')).toBeInTheDocument();
      expect(screen.getByText('Item 3')).toBeInTheDocument();
    });

    it('applies default responsive grid classes', () => {
      const { container } = render(
        <Grid>
          <div>Item</div>
        </Grid>
      );

      const gridElement = container.firstChild as HTMLElement;
      expect(gridElement).toHaveClass('grid');
      expect(gridElement).toHaveClass('grid-cols-1');
      expect(gridElement).toHaveClass('md:grid-cols-2');
      expect(gridElement).toHaveClass('lg:grid-cols-3');
    });

    it('applies default gap and alignment classes', () => {
      const { container } = render(
        <Grid>
          <div>Item</div>
        </Grid>
      );

      const gridElement = container.firstChild as HTMLElement;
      expect(gridElement).toHaveClass('gap-4'); // default md gap
      expect(gridElement).toHaveClass('items-stretch'); // default align
      expect(gridElement).toHaveClass('justify-items-stretch'); // default justify
    });

    it('applies custom className', () => {
      const { container } = render(
        <Grid className="custom-class">
          <div>Item</div>
        </Grid>
      );

      const gridElement = container.firstChild as HTMLElement;
      expect(gridElement).toHaveClass('custom-class');
    });
  });

  describe('Column Configuration', () => {
    it('applies fixed number of columns', () => {
      const { container } = render(
        <Grid columns={4}>
          <div>Item</div>
        </Grid>
      );

      const gridElement = container.firstChild as HTMLElement;
      expect(gridElement).toHaveClass('grid-cols-4');
    });

    it('applies custom responsive columns', () => {
      const { container } = render(
        <Grid columns={{ mobile: 1, tablet: 3, desktop: 4 }}>
          <div>Item</div>
        </Grid>
      );

      const gridElement = container.firstChild as HTMLElement;
      expect(gridElement).toHaveClass('grid-cols-1');
      expect(gridElement).toHaveClass('md:grid-cols-3');
      expect(gridElement).toHaveClass('lg:grid-cols-4');
    });

    it('applies auto-fit columns', () => {
      const { container } = render(
        <Grid columns="auto">
          <div>Item</div>
        </Grid>
      );

      const gridElement = container.firstChild as HTMLElement;
      expect(gridElement).toHaveClass('grid-cols-[repeat(auto-fit,minmax(250px,1fr))]');
    });

    it('handles partial responsive configuration', () => {
      const { container } = render(
        <Grid columns={{ tablet: 3 }}>
          <div>Item</div>
        </Grid>
      );

      const gridElement = container.firstChild as HTMLElement;
      expect(gridElement).toHaveClass('grid-cols-1'); // default mobile
      expect(gridElement).toHaveClass('md:grid-cols-3'); // custom tablet
      expect(gridElement).toHaveClass('lg:grid-cols-3'); // default desktop (fallback to tablet)
    });
  });

  describe('Gap Spacing', () => {
    it('applies different gap sizes', () => {
      const gapSizes = [
        { gap: 'none' as const, expectedClass: '' },
        { gap: 'sm' as const, expectedClass: 'gap-2' },
        { gap: 'md' as const, expectedClass: 'gap-4' },
        { gap: 'lg' as const, expectedClass: 'gap-6' },
        { gap: 'xl' as const, expectedClass: 'gap-8' },
        { gap: '2xl' as const, expectedClass: 'gap-12' },
      ];

      gapSizes.forEach(({ gap, expectedClass }) => {
        const { container } = render(
          <Grid gap={gap}>
            <div>Item</div>
          </Grid>
        );

        const gridElement = container.firstChild as HTMLElement;
        if (expectedClass) {
          expect(gridElement).toHaveClass(expectedClass);
        } else {
          // For 'none', check that no gap class is applied
          expect(gridElement.className).not.toMatch(/gap-\d+/);
        }
      });
    });
  });

  describe('Alignment Options', () => {
    it('applies different alignment options', () => {
      const alignments = [
        { align: 'start' as const, expectedClass: 'items-start' },
        { align: 'center' as const, expectedClass: 'items-center' },
        { align: 'end' as const, expectedClass: 'items-end' },
        { align: 'stretch' as const, expectedClass: 'items-stretch' },
      ];

      alignments.forEach(({ align, expectedClass }) => {
        const { container } = render(
          <Grid align={align}>
            <div>Item</div>
          </Grid>
        );

        const gridElement = container.firstChild as HTMLElement;
        expect(gridElement).toHaveClass(expectedClass);
      });
    });

    it('applies different justification options', () => {
      const justifications = [
        { justify: 'start' as const, expectedClass: 'justify-items-start' },
        { justify: 'center' as const, expectedClass: 'justify-items-center' },
        { justify: 'end' as const, expectedClass: 'justify-items-end' },
        { justify: 'stretch' as const, expectedClass: 'justify-items-stretch' },
      ];

      justifications.forEach(({ justify, expectedClass }) => {
        const { container } = render(
          <Grid justify={justify}>
            <div>Item</div>
          </Grid>
        );

        const gridElement = container.firstChild as HTMLElement;
        expect(gridElement).toHaveClass(expectedClass);
      });
    });

    it('applies equal height when specified', () => {
      const { container } = render(
        <Grid equalHeight>
          <div>Item</div>
        </Grid>
      );

      const gridElement = container.firstChild as HTMLElement;
      expect(gridElement).toHaveClass('auto-rows-fr');
    });
  });

  describe('HTML Attributes', () => {
    it('forwards HTML attributes correctly', () => {
      const { container } = render(
        <Grid data-testid="grid-element" role="grid">
          <div>Item</div>
        </Grid>
      );

      const gridElement = container.firstChild as HTMLElement;
      expect(gridElement).toHaveAttribute('data-testid', 'grid-element');
      expect(gridElement).toHaveAttribute('role', 'grid');
    });
  });
});

describe('GridItem Component', () => {
  it('renders children correctly', () => {
    render(
      <GridItem>
        <div>Grid Item Content</div>
      </GridItem>
    );

    expect(screen.getByText('Grid Item Content')).toBeInTheDocument();
  });

  it('applies column span classes', () => {
    const { container } = render(
      <GridItem span={2}>
        <div>Item</div>
      </GridItem>
    );

    const itemElement = container.firstChild as HTMLElement;
    expect(itemElement).toHaveClass('col-span-2');
  });

  it('applies full column span', () => {
    const { container } = render(
      <GridItem span="full">
        <div>Item</div>
      </GridItem>
    );

    const itemElement = container.firstChild as HTMLElement;
    expect(itemElement).toHaveClass('col-span-full');
  });

  it('applies row span classes', () => {
    const { container } = render(
      <GridItem rowSpan={3}>
        <div>Item</div>
      </GridItem>
    );

    const itemElement = container.firstChild as HTMLElement;
    expect(itemElement).toHaveClass('row-span-3');
  });

  it('applies start position classes', () => {
    const { container } = render(
      <GridItem colStart={2} rowStart={3}>
        <div>Item</div>
      </GridItem>
    );

    const itemElement = container.firstChild as HTMLElement;
    expect(itemElement).toHaveClass('col-start-2');
    expect(itemElement).toHaveClass('row-start-3');
  });

  it('applies custom className', () => {
    const { container } = render(
      <GridItem className="custom-item-class">
        <div>Item</div>
      </GridItem>
    );

    const itemElement = container.firstChild as HTMLElement;
    expect(itemElement).toHaveClass('custom-item-class');
  });

  it('handles auto span values', () => {
    const { container } = render(
      <GridItem span="auto" rowSpan="auto">
        <div>Item</div>
      </GridItem>
    );

    const itemElement = container.firstChild as HTMLElement;
    expect(itemElement).toHaveClass('col-span-auto');
    expect(itemElement).toHaveClass('row-span-auto');
  });
});

describe('ResponsiveGrid Component', () => {
  it('applies cards variant by default', () => {
    const { container } = render(
      <ResponsiveGrid>
        <div>Item</div>
      </ResponsiveGrid>
    );

    const gridElement = container.firstChild as HTMLElement;
    expect(gridElement).toHaveClass('grid-cols-1');
    expect(gridElement).toHaveClass('md:grid-cols-2');
    expect(gridElement).toHaveClass('lg:grid-cols-3');
  });

  it('applies different variants correctly', () => {
    const variants = [
      { variant: 'features' as const, expected: { mobile: 1, tablet: 2, desktop: 4 } },
      { variant: 'gallery' as const, expected: { mobile: 2, tablet: 3, desktop: 4 } },
      { variant: 'list' as const, expected: { mobile: 1, tablet: 1, desktop: 2 } },
      { variant: 'stats' as const, expected: { mobile: 2, tablet: 3, desktop: 4 } },
    ];

    variants.forEach(({ variant, expected }) => {
      const { container } = render(
        <ResponsiveGrid variant={variant}>
          <div>Item</div>
        </ResponsiveGrid>
      );

      const gridElement = container.firstChild as HTMLElement;
      expect(gridElement).toHaveClass(`grid-cols-${expected.mobile}`);
      expect(gridElement).toHaveClass(`md:grid-cols-${expected.tablet}`);
      expect(gridElement).toHaveClass(`lg:grid-cols-${expected.desktop}`);
    });
  });

  it('forwards other props correctly', () => {
    const { container } = render(
      <ResponsiveGrid gap="lg" align="center" className="custom-responsive">
        <div>Item</div>
      </ResponsiveGrid>
    );

    const gridElement = container.firstChild as HTMLElement;
    expect(gridElement).toHaveClass('gap-6'); // lg gap
    expect(gridElement).toHaveClass('items-center');
    expect(gridElement).toHaveClass('custom-responsive');
  });
});

describe('AutoGrid Component', () => {
  it('applies default minimum column width', () => {
    const { container } = render(
      <AutoGrid>
        <div>Item</div>
      </AutoGrid>
    );

    const gridElement = container.firstChild as HTMLElement;
    expect(gridElement).toHaveClass('grid-cols-[repeat(auto-fit,minmax(250px,1fr))]');
  });

  it('applies different minimum column widths', () => {
    const widths = [
      { width: 'sm' as const, expected: 'grid-cols-[repeat(auto-fit,minmax(200px,1fr))]' },
      { width: 'md' as const, expected: 'grid-cols-[repeat(auto-fit,minmax(250px,1fr))]' },
      { width: 'lg' as const, expected: 'grid-cols-[repeat(auto-fit,minmax(300px,1fr))]' },
      { width: 'xl' as const, expected: 'grid-cols-[repeat(auto-fit,minmax(350px,1fr))]' },
    ];

    widths.forEach(({ width, expected }) => {
      const { container } = render(
        <AutoGrid minColumnWidth={width}>
          <div>Item</div>
        </AutoGrid>
      );

      const gridElement = container.firstChild as HTMLElement;
      expect(gridElement).toHaveClass(expected);
    });
  });

  it('applies default gap and alignment', () => {
    const { container } = render(
      <AutoGrid>
        <div>Item</div>
      </AutoGrid>
    );

    const gridElement = container.firstChild as HTMLElement;
    expect(gridElement).toHaveClass('gap-4'); // default md gap
    expect(gridElement).toHaveClass('items-stretch');
    expect(gridElement).toHaveClass('justify-items-stretch');
  });
});

describe('MasonryGrid Component', () => {
  it('applies default column configuration', () => {
    const { container } = render(
      <MasonryGrid>
        <div>Item 1</div>
        <div>Item 2</div>
      </MasonryGrid>
    );

    const gridElement = container.firstChild as HTMLElement;
    expect(gridElement).toHaveClass('columns-1');
    expect(gridElement).toHaveClass('md:columns-2');
    expect(gridElement).toHaveClass('lg:columns-3');
  });

  it('applies custom column configuration', () => {
    const { container } = render(
      <MasonryGrid columns={{ mobile: 2, tablet: 3, desktop: 4 }}>
        <div>Item 1</div>
        <div>Item 2</div>
      </MasonryGrid>
    );

    const gridElement = container.firstChild as HTMLElement;
    expect(gridElement).toHaveClass('columns-2');
    expect(gridElement).toHaveClass('md:columns-3');
    expect(gridElement).toHaveClass('lg:columns-4');
  });

  it('wraps children in break-inside-avoid containers', () => {
    const { container } = render(
      <MasonryGrid>
        <div>Item 1</div>
        <div>Item 2</div>
      </MasonryGrid>
    );

    const wrappers = container.querySelectorAll('.break-inside-avoid');
    expect(wrappers).toHaveLength(2);
    expect(wrappers[0]).toHaveClass('mb-4');
    expect(wrappers[1]).toHaveClass('mb-4');
  });

  it('applies gap spacing correctly', () => {
    const { container } = render(
      <MasonryGrid gap="lg">
        <div>Item</div>
      </MasonryGrid>
    );

    const gridElement = container.firstChild as HTMLElement;
    expect(gridElement).toHaveClass('gap-6'); // lg gap
  });
});

describe('Responsive Behavior', () => {
  it('maintains consistent class structure across components', () => {
    const components = [
      { Component: Grid, props: {} },
      { Component: ResponsiveGrid, props: { variant: 'cards' as const } },
    ];

    components.forEach(({ Component, props }) => {
      const { container } = render(
        <Component {...props}>
          <div>Item</div>
        </Component>
      );

      const element = container.firstChild as HTMLElement;
      expect(element).toHaveClass('grid');
      expect(element.className).toMatch(/grid-cols-\d+/);
      expect(element.className).toMatch(/gap-\d+/);
    });
  });

  it('handles edge cases gracefully', () => {
    // Test with no children
    const { container: emptyContainer } = render(<Grid />);
    expect(emptyContainer.firstChild).toHaveClass('grid');

    // Test with single child
    const { container: singleContainer } = render(
      <Grid>
        <div>Single Item</div>
      </Grid>
    );
    expect(singleContainer.firstChild).toHaveClass('grid');
    expect(screen.getByText('Single Item')).toBeInTheDocument();

    // Test with many children
    const manyItems = Array.from({ length: 20 }, (_, i) => (
      <div key={i}>Item {i + 1}</div>
    ));
    const { container: manyContainer } = render(
      <Grid>{manyItems}</Grid>
    );
    expect(manyContainer.firstChild).toHaveClass('grid');
    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Item 20')).toBeInTheDocument();
  });
});

describe('Accessibility', () => {
  it('supports ARIA attributes', () => {
    const { container } = render(
      <Grid role="grid" aria-label="Product grid">
        <div role="gridcell">Item</div>
      </Grid>
    );

    const gridElement = container.firstChild as HTMLElement;
    expect(gridElement).toHaveAttribute('role', 'grid');
    expect(gridElement).toHaveAttribute('aria-label', 'Product grid');
  });

  it('supports keyboard navigation attributes', () => {
    const { container } = render(
      <Grid tabIndex={0}>
        <div>Item</div>
      </Grid>
    );

    const gridElement = container.firstChild as HTMLElement;
    expect(gridElement).toHaveAttribute('tabIndex', '0');
  });
});

describe('Performance', () => {
  it('renders efficiently with many items', () => {
    const startTime = performance.now();
    
    const manyItems = Array.from({ length: 100 }, (_, i) => (
      <div key={i}>Item {i + 1}</div>
    ));
    
    render(<Grid>{manyItems}</Grid>);
    
    const endTime = performance.now();
    const renderTime = endTime - startTime;
    
    // Should render 100 items in less than 100ms
    expect(renderTime).toBeLessThan(100);
  });

  it('handles rapid re-renders without issues', () => {
    const { rerender } = render(
      <Grid gap="sm">
        <div>Item</div>
      </Grid>
    );

    // Rapidly change props
    for (let i = 0; i < 10; i++) {
      rerender(
        <Grid gap={i % 2 === 0 ? 'sm' : 'lg'}>
          <div>Item {i}</div>
        </Grid>
      );
    }

    expect(screen.getByText('Item 9')).toBeInTheDocument();
  });
});