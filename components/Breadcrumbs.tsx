import React from 'react';
import { Link } from 'react-router-dom';

export interface BreadcrumbItem {
  label: string;
  path?: string;
}

const Breadcrumbs: React.FC<{ items: BreadcrumbItem[] }> = ({ items }) => (
  <nav className="breadcrumbs" aria-label="Breadcrumb">
    <ol>
      {items.map((item, index) => (
        <li key={`${item.label}-${index}`}>
          {item.path && index < items.length - 1
            ? <Link to={item.path}>{item.label}</Link>
            : <span aria-current={index === items.length - 1 ? 'page' : undefined}>{item.label}</span>}
        </li>
      ))}
    </ol>
  </nav>
);

export default Breadcrumbs;

