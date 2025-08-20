// Responsive utilities for breakpoints and device detection

export const breakpoints = {
  xs: 0,
  sm: 600,
  md: 900,
  lg: 1200,
  xl: 1536,
};

export const getSpacing = (size) => {
  switch (size) {
    case 'xs':
      return { xs: 1, sm: 2 };
    case 'sm':
      return { xs: 2, sm: 3 };
    case 'md':
      return { xs: 2, sm: 3, md: 4 };
    case 'lg':
      return { xs: 3, sm: 4, md: 5 };
    case 'xl':
      return { xs: 4, sm: 5, md: 6 };
    default:
      return { xs: 2, sm: 3, md: 4 };
  }
};

export const getGridBreakpoints = (mobile = 12, tablet = 6, desktop = 4, wide = 3) => ({
  xs: mobile,
  sm: tablet,
  md: desktop,
  lg: wide,
});

export const responsiveTypography = {
  h1: {
    fontSize: { xs: '1.75rem', sm: '2.125rem', md: '2.5rem' },
    lineHeight: { xs: 1.3, sm: 1.25, md: 1.2 },
  },
  h2: {
    fontSize: { xs: '1.5rem', sm: '1.875rem', md: '2.25rem' },
    lineHeight: { xs: 1.35, sm: 1.3, md: 1.25 },
  },
  h3: {
    fontSize: { xs: '1.25rem', sm: '1.5rem', md: '1.875rem' },
    lineHeight: { xs: 1.4, sm: 1.35, md: 1.3 },
  },
  h4: {
    fontSize: { xs: '1.125rem', sm: '1.25rem', md: '1.5rem' },
    lineHeight: { xs: 1.45, sm: 1.4, md: 1.35 },
  },
  h5: {
    fontSize: { xs: '1rem', sm: '1.125rem', md: '1.25rem' },
    lineHeight: { xs: 1.5, sm: 1.45, md: 1.4 },
  },
  h6: {
    fontSize: { xs: '0.875rem', sm: '1rem', md: '1.125rem' },
    lineHeight: { xs: 1.55, sm: 1.5, md: 1.45 },
  },
};

export const responsiveCardPadding = {
  xs: 2,
  sm: 3,
  md: 4,
};

export const responsiveContainerMaxWidth = {
  xs: '100%',
  sm: '100%',
  md: '100%',
  lg: 'xl',
  xl: 'xl',
};

// Animation variants for different screen sizes
export const animationConfig = {
  mobile: {
    duration: 200,
    stiffness: 300,
    damping: 30,
  },
  desktop: {
    duration: 300,
    stiffness: 200,
    damping: 25,
  },
};

// Common responsive patterns
export const flexResponsive = {
  center: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  spaceBetween: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  column: {
    display: 'flex',
    flexDirection: 'column',
  },
  row: {
    display: 'flex',
    flexDirection: 'row',
  },
  wrap: {
    display: 'flex',
    flexWrap: 'wrap',
  },
};

export const responsiveGaps = {
  xs: 1,
  sm: 2,
  md: 3,
  lg: 4,
};
