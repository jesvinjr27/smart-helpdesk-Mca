import React, { useState } from 'react';

export const TicketSubmissionConfirmation = ({
  ticket,
  requestType = 'INCIDENT',
  categoryName = 'General Support',
  subcategory = 'General',
  priority = 'MEDIUM',
  slaTarget = '24-Hour Resolution Target',
  locationData = {},
  onViewTicket,
  onBackToDashboard,
  onCreateAnother,
}) => {
  const [copied, setCopied] = useState(false);

  const ticketRef = ticket?.ticket_number || (ticket?.id ? `#TECH-${ticket.id}` : '#TECH-PENDING');

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(ticketRef);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      // Fallback
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 animate-scaleUp">
      <div className="bg-app-background border border-brand-primary/20 rounded-3xl p-6 sm:p-10 shadow-subtle text-center space-y-8 relative overflow-hidden">
        {/* Soft Background Accent Glow */}
        <div className="absolute -top-24 -left-24 w-72 h-72 bg-brand-accent/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-brand-secondary/20 rounded-full blur-3xl pointer-events-none" />

        {/* Celebration Icon */}
        <div className="relative inline-flex items-center justify-center">
          <div className="w-20 h-20 rounded-3xl bg-brand-primary text-white flex items-center justify-center text-3xl shadow-lg ring-8 ring-brand-primary/10">
            <i className="bi bi-check-lg" />
          </div>
          <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs shadow-md">
            <i className="bi bi-shield-check" />
          </div>
        </div>

        {/* Heading */}
        <div className="space-y-2 relative">
          <span className="text-[11px] font-extrabold uppercase tracking-widest text-brand-secondary">
            IT Service Desk Dispatch
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-brand-primary tracking-tight m-0">
            Ticket Logged Successfully
          </h2>
          <p className="text-xs sm:text-sm text-brand-secondary max-w-lg mx-auto m-0 leading-relaxed">
            Your support request has been registered in the ITSM queue and assigned an SLA resolution timeline.
          </p>
        </div>

        {/* Reference Number Card */}
        <div className="p-4 sm:p-5 rounded-2xl bg-brand-secondary/15 border border-brand-secondary/30 inline-flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 shadow-sm">
          <div className="text-left">
            <div className="text-[10px] font-bold uppercase tracking-wider text-brand-secondary">
              Official Reference Number
            </div>
            <div className="text-xl sm:text-2xl font-mono font-extrabold text-brand-primary">
              {ticketRef}
            </div>
          </div>
          <button
            type="button"
            onClick={handleCopy}
            className="px-3.5 py-2 rounded-xl bg-app-background border border-brand-primary/20 text-brand-primary hover:bg-brand-primary hover:text-white transition-all text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-sm"
          >
            <i className={`bi ${copied ? 'bi-check2' : 'bi-clipboard'}`} />
            <span>{copied ? 'Copied to Clipboard!' : 'Copy Reference ID'}</span>
          </button>
        </div>

        {/* Ticket Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-left">
          <div className="p-3.5 rounded-2xl bg-brand-secondary/10 border border-brand-secondary/20">
            <div className="text-[10px] font-bold text-brand-secondary uppercase mb-1">Subject</div>
            <div className="text-xs font-bold text-brand-primary truncate">{ticket?.title}</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-brand-secondary/10 border border-brand-secondary/20">
            <div className="text-[10px] font-bold text-brand-secondary uppercase mb-1">Category & Area</div>
            <div className="text-xs font-bold text-brand-primary truncate">
              {categoryName} • {subcategory}
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-brand-secondary/10 border border-brand-secondary/20">
            <div className="text-[10px] font-bold text-brand-secondary uppercase mb-1">Priority & SLA Target</div>
            <div className="text-xs font-bold text-brand-primary flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-brand-primary" />
              <span>{priority}</span>
              <span className="text-[11px] text-brand-secondary font-normal">({slaTarget})</span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-brand-secondary/10 border border-brand-secondary/20">
            <div className="text-[10px] font-bold text-brand-secondary uppercase mb-1">Queue Status</div>
            <div className="text-xs font-bold text-emerald-700 flex items-center gap-1.5">
              <i className="bi bi-clock-history" />
              <span>{ticket?.status || 'NEW'} (Awaiting Triage)</span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-brand-secondary/10 border border-brand-secondary/20">
            <div className="text-[10px] font-bold text-brand-secondary uppercase mb-1">Logged Timestamp</div>
            <div className="text-xs font-bold text-brand-primary">
              {ticket?.created_at ? new Date(ticket.created_at).toLocaleString() : new Date().toLocaleString()}
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-brand-secondary/10 border border-brand-secondary/20">
            <div className="text-[10px] font-bold text-brand-secondary uppercase mb-1">Location</div>
            <div className="text-xs font-bold text-brand-primary truncate">
              {locationData?.building || 'Main Campus'} {locationData?.roomNumber ? `(${locationData.roomNumber})` : ''}
            </div>
          </div>
        </div>

        {/* Guidance Note */}
        <div className="p-4 rounded-2xl bg-brand-primary/10 border border-brand-primary/20 text-xs text-brand-primary flex items-start gap-3 text-left">
          <i className="bi bi-info-circle-fill text-brand-primary text-base flex-shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-bold">Next Steps:</span> Our IT technicians are notified. You can post follow-up comments, attach additional log files, or inspect live triage activity by viewing the ticket details page below.
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={onViewTicket}
            className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-brand-primary hover:bg-brand-primary/90 text-white font-bold text-xs sm:text-sm transition-all shadow-subtle flex items-center justify-center gap-2 cursor-pointer scale-[1.01]"
          >
            <i className="bi bi-ticket-detailed" />
            <span>View Ticket Details</span>
          </button>

          <button
            type="button"
            onClick={onBackToDashboard}
            className="w-full sm:w-auto px-5 py-3.5 rounded-2xl bg-app-background border border-brand-primary/20 text-brand-primary hover:bg-brand-secondary/15 font-semibold text-xs sm:text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <i className="bi bi-grid" />
            <span>Return to Dashboard</span>
          </button>

          <button
            type="button"
            onClick={onCreateAnother}
            className="w-full sm:w-auto px-5 py-3.5 rounded-2xl bg-app-background border border-brand-primary/20 text-brand-primary hover:bg-brand-secondary/15 font-semibold text-xs sm:text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <i className="bi bi-plus-lg" />
            <span>Submit Another Ticket</span>
          </button>
        </div>
      </div>
    </div>
  );
};
