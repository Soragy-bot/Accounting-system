import React from 'react';
import styles from './LoadingSkeleton.module.css';

interface LoadingSkeletonProps {
  width?: string;
  height?: string;
  className?: string;
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = React.memo(({
  width = '100%',
  height = '1rem',
  className = '',
}) => {
  return (
    <div
      className={`${styles.skeleton} ${className}`}
      style={{ width, height }}
      aria-hidden="true"
    />
  );
});

interface LoadingSkeletonGroupProps {
  count?: number;
  className?: string;
}

export const LoadingSkeletonGroup: React.FC<LoadingSkeletonGroupProps> = React.memo(({
  count = 3,
  className = '',
}) => {
  return (
    <div className={`${styles.group} ${className}`}>
      {Array.from({ length: count }).map((_, index) => (
        <LoadingSkeleton key={index} />
      ))}
    </div>
  );
});

