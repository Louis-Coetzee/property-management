import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const processRecurringInvoices = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const today = new Date().toISOString().split('T')[0];
    
    // Get all companies to check their timezones
    const companies = await ctx.db.query("companies").collect();
    
    let totalCreated = 0;
    let totalProcessed = 0;

    for (const company of companies) {
      // Get timezone for this company, default to Africa/Johannesburg if not set
      const companyTimezone = company.timezone || 'Africa/Johannesburg';
      
      // Get current time in company's timezone
      const companyTime = new Date(now).toLocaleString('en-US', { timeZone: companyTimezone });
      const companyHour = new Date(companyTime).getHours();
      const companyDateStr = new Date(companyTime).toISOString().split('T')[0];
      
      // Get invoices due today for this company (where nextRecurringDate <= today)
      const companyInvoices = await ctx.db
        .query("invoices")
        .withIndex("by_company", (q) => q.eq("companyId", company._id))
        .collect();

      const toProcess = companyInvoices.filter(inv => 
        inv.isRecurring && 
        inv.nextRecurringDate && 
        inv.nextRecurringDate <= companyDateStr
      );

      for (const parentInvoice of toProcess) {
        try {
          // Check if it's the scheduled time for this company (08:00, 13:00, or 18:00)
          const scheduledHour = parentInvoice.scheduledSendTime || '08:00';
          const expectedHour = parseInt(scheduledHour.split(':')[0]);
          
          // Only process if current hour matches scheduled hour (with +/- 1 hour tolerance for cron reliability)
          if (companyHour < expectedHour - 1 || companyHour > expectedHour + 1) {
            continue;
          }

          const invoiceNumber = `INV-${companyDateStr.replace(/-/g, '')}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
          const issueDate = companyDateStr;
          
          let dueDate: string;
          if (parentInvoice.recurringDueDateDayOfNextMonth) {
            const due = new Date(issueDate);
            due.setMonth(due.getMonth() + 1);
            due.setDate(parentInvoice.recurringDueDateDayOfNextMonth);
            dueDate = due.toISOString().split('T')[0];
          } else if (parentInvoice.recurringDueDayOfMonth) {
            const due = new Date(issueDate);
            due.setDate(parentInvoice.recurringDueDayOfMonth);
            dueDate = due.toISOString().split('T')[0];
          } else if (parentInvoice.recurringDueDays) {
            const due = new Date(issueDate);
            due.setDate(due.getDate() + parentInvoice.recurringDueDays);
            dueDate = due.toISOString().split('T')[0];
          } else {
            dueDate = new Date(now + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
          }

          let nextRecurringDate: string | undefined;
          if (parentInvoice.recurringInterval === 'monthly' && parentInvoice.recurringDayOfMonth) {
            const next = new Date(issueDate);
            next.setMonth(next.getMonth() + 1);
            next.setDate(parentInvoice.recurringDayOfMonth);
            nextRecurringDate = next.toISOString().split('T')[0];
          } else if (parentInvoice.recurringDays) {
            const next = new Date(issueDate);
            next.setDate(next.getDate() + parentInvoice.recurringDays);
            nextRecurringDate = next.toISOString().split('T')[0];
          }

          const publicToken = Math.random().toString(36).substring(2, 18) + Math.random().toString(36).substring(2, 18);

          await ctx.db.insert("invoices", {
            companyId: parentInvoice.companyId,
            clientId: parentInvoice.clientId,
            parentInvoiceId: parentInvoice._id,
            invoiceNumber,
            clientName: parentInvoice.clientName,
            clientEmail: parentInvoice.clientEmail,
            clientCompany: parentInvoice.clientCompany,
            clientPhone: parentInvoice.clientPhone,
            clientAddress: parentInvoice.clientAddress,
            status: "draft",
            items: parentInvoice.items,
            subtotal: parentInvoice.subtotal,
            taxRate: parentInvoice.taxRate,
            taxAmount: parentInvoice.taxAmount,
            total: parentInvoice.total,
            amountPaid: 0,
            issueDate,
            dueDate,
            notes: parentInvoice.notes,
            publicToken,
            publicEnabled: true,
            isRecurring: parentInvoice.isRecurring,
            recurringInterval: parentInvoice.recurringInterval,
            recurringDays: parentInvoice.recurringDays,
            recurringDayOfMonth: parentInvoice.recurringDayOfMonth,
            recurringDueDays: parentInvoice.recurringDueDays,
            recurringDueDayOfMonth: parentInvoice.recurringDueDayOfMonth,
            recurringDueDateDayOfNextMonth: parentInvoice.recurringDueDateDayOfNextMonth,
            nextRecurringDate,
            scheduledSendTime: parentInvoice.scheduledSendTime,
            createdAt: now,
            updatedAt: now,
          });

          await ctx.db.patch(parentInvoice._id, {
            nextRecurringDate,
            lastRecurringProcessedAt: now,
            updatedAt: now,
          });

          totalCreated++;
          totalProcessed++;
        } catch (error) {
          console.error(`Failed to process invoice ${parentInvoice._id}:`, error);
        }
      }
    }

    return { success: true, processed: totalProcessed, created: totalCreated };
  },
});

export const getRecurringInvoicesDueToday = query({
  args: {},
  handler: async (ctx) => {
    const today = new Date().toISOString().split('T')[0];
    
    const allInvoices = await ctx.db.query("invoices").collect();
    
    return allInvoices.filter(inv => 
      inv.isRecurring && 
      inv.nextRecurringDate && 
      inv.nextRecurringDate <= today
    );
  },
});

export const getCompaniesTimezones = query({
  args: {},
  handler: async (ctx) => {
    const companies = await ctx.db.query("companies").collect();
    return companies.map(c => ({
      id: c._id,
      name: c.name,
      timezone: c.timezone || 'Africa/Johannesburg',
    }));
  },
});