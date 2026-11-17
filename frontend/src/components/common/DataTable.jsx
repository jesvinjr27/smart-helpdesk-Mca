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
  <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 select-none">
    {children}
  </thead>
);

export const TableRow = ({ children, onClick, className = '' }) => (
  <tr
    onClick={onClick}
    className={`border-b border-slate-100 dark:border-slate-800/80 transition-colors ${
      onClick ? 'cursor-pointer hover:bg-slate-50/80 dark:hover:bg-slate-800/40' : ''
    } ${className}`}
  >
    {children}
  </tr>
);

export const TableHeaderCell = ({ children, className = '' }) => (
  <th className={`px-4 py-3.5 whitespace-nowrap text-xs font-semibold ${className}`}>
    {children}
  </th>
);

export const TableCell = ({ children, className = '' }) => (
  <td className={`px-4 py-3 text-sm text-slate-700 dark:text-slate-300 align-middle ${className}`}>
    {children}
  </td>
);
