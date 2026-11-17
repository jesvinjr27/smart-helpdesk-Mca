import React from 'react';

export const DataTable = ({ children, className = '' }) => {
  return (
    <div className={`w-full max-w-full overflow-x-auto ${className}`}>
      <table className="w-full text-left border-collapse min-w-[720px]">
        {children}
      </table>
    </div>
  );
};

export const TableHead = ({ children }) => (
  <thead className="bg-brand-secondary/15 border-b border-brand-primary/15 text-[11px] font-semibold uppercase tracking-wider text-brand-primary select-none">
    {children}
  </thead>
);

export const TableRow = ({ children, onClick, className = '' }) => (
  <tr
    onClick={onClick}
    className={`border-b border-brand-primary/10 transition-colors ${
      onClick ? 'cursor-pointer hover:bg-brand-accent/15' : ''
    } ${className}`}
  >
    {children}
  </tr>
);

export const TableHeaderCell = ({ children, className = '' }) => (
  <th className={`px-4 py-3.5 whitespace-nowrap text-xs font-semibold text-brand-primary ${className}`}>
    {children}
  </th>
);

export const TableCell = ({ children, className = '' }) => (
  <td className={`px-4 py-3 text-sm text-brand-primary align-middle ${className}`}>
    {children}
  </td>
);
