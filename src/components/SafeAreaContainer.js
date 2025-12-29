import React from 'react';

const SafeAreaContainer = ({ children, className, style, paddingTop = 0, paddingBottom = 0, paddingLeft = 0, paddingRight = 0 }) => {
  const safeAreaStyle = {
    paddingTop: `calc(${paddingTop}px + env(safe-area-inset-top))`,
    paddingBottom: `calc(${paddingBottom}px + env(safe-area-inset-bottom))`,
    paddingLeft: `calc(${paddingLeft}px + env(safe-area-inset-left))`,
    paddingRight: `calc(${paddingRight}px + env(safe-area-inset-right))`,
    ...style,
  };

  return (
    <div className={className} style={safeAreaStyle}>
      {children}
    </div>
  );
};

export default SafeAreaContainer;
