const PDFDocument = require('pdfkit');
const Record = require('../models/Record');
const User = require('../models/User');
const Category = require('../models/Category');
const { escapeCsvField } = require('../utils/sanitize');

/**
 * Convert client timezone offset (minutes) to a MongoDB timezone string.
 * getTimezoneOffset() returns negative for east of UTC (e.g., -480 for UTC+8).
 * MongoDB expects format like "+08:00" or "-05:00".
 */
const getTzString = (offsetMinutes) => {
    const parsed = parseInt(offsetMinutes, 10);
    if (isNaN(parsed)) return '+00:00';
    // getTimezoneOffset is inverted: -480 means UTC+8
    const totalMins = -parsed;
    const sign = totalMins >= 0 ? '+' : '-';
    const hours = Math.floor(Math.abs(totalMins) / 60);
    const mins = Math.abs(totalMins) % 60;
    return `${sign}${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
};

/**
 * Build the common report filter from query params.
 * Supports: dateFrom, dateTo, month (with timezone), category, userId
 */
const buildReportFilter = (query, user) => {
    const { dateFrom, dateTo, category, userId, month, tzOffset } = query;
    const filter = {};

    // Optionally filter by specific user - REMOVED since createdBy is removed
    /* if (userId) {
        filter.createdBy = userId;
    } */

    if (month) {
        // Filter by month number across ALL years, timezone-aware
        const monthNum = parseInt(month, 10);
        if (monthNum >= 1 && monthNum <= 12) {
            const tz = getTzString(tzOffset);
            filter.$expr = {
                $eq: [{ $month: { date: '$date', timezone: tz } }, monthNum],
            };
        }
    } else if (dateFrom || dateTo) {
        filter.date = {};
        if (dateFrom) filter.date.$gte = new Date(dateFrom);
        if (dateTo) filter.date.$lte = new Date(dateTo);
        if (Object.keys(filter.date).length === 0) delete filter.date;
    }

    if (category) filter.category = category;

    return filter;
};

/**
 * @desc    Get distinct years that have records (for year dropdown)
 * @route   GET /api/reports/years
 * @access  Private/Admin
 */
const getDistinctYears = async (req, res, next) => {
    try {
        const tz = getTzString(req.query.tzOffset);

        const matchFilter = {};

        const result = await Record.aggregate([
            { $match: matchFilter },
            {
                $group: {
                    _id: { $year: { date: '$date', timezone: tz } },
                },
            },
            { $sort: { _id: -1 } },
        ]);

        const years = result.map((r) => r._id).filter(Boolean);

        res.status(200).json({
            success: true,
            data: years,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Generate report data (JSON)
 * @route   GET /api/reports
 * @access  Private/Admin
 */
const getReport = async (req, res, next) => {
    try {
        const filter = buildReportFilter(req.query, req.user);

        // Get records
        const records = await Record.find(filter)
            .populate('category', 'name color')
            .sort({ date: -1 });

        // Summary stats
        const totalRecords = records.length;

        // Count by category
        const categoryMap = {};
        records.forEach((r) => {
            const catName = r.category ? r.category.name : 'Uncategorized';
            categoryMap[catName] = (categoryMap[catName] || 0) + 1;
        });

        res.status(200).json({
            success: true,
            data: {
                summary: {
                    totalRecords,
                    recordsByCategory: Object.entries(categoryMap).map(([name, count]) => ({
                        name,
                        count,
                    })),
                },
                records,
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Export report to PDF
 * @route   GET /api/reports/pdf
 * @access  Private/Admin
 */
const exportPDF = async (req, res, next) => {
    try {
        const filter = buildReportFilter(req.query, req.user);
        const { dateFrom, dateTo, month } = req.query;

        const records = await Record.find(filter)
            .populate('category', 'name')
            .sort({ date: -1 });

        // Create PDF
        const doc = new PDFDocument({ margin: 40, size: 'A4' });

        // Set response headers
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader(
            'Content-Disposition',
            `attachment; filename=report_${Date.now()}.pdf`
        );

        doc.pipe(res);

        // Title
        doc
            .fontSize(22)
            .font('Helvetica-Bold')
            .text('Record Management System', { align: 'center' });
        doc.fontSize(14).font('Helvetica').text('Report', { align: 'center' });
        doc.moveDown();

        // Date range
        let periodStr;
        if (month) {
            const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
            periodStr = `Month: ${MONTHS[parseInt(month, 10) - 1] || month} (All Years)`;
        } else {
            const fromStr = dateFrom ? new Date(dateFrom).toLocaleDateString() : 'Beginning';
            const toStr = dateTo ? new Date(dateTo).toLocaleDateString() : 'Present';
            periodStr = `Period: ${fromStr} — ${toStr}`;
        }
        doc.fontSize(10).text(periodStr, { align: 'center' });
        doc.text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });
        doc.moveDown(2);

        // Summary
        doc.fontSize(14).font('Helvetica-Bold').text('Summary');
        doc.moveDown(0.5);
        doc
            .fontSize(10)
            .font('Helvetica')
            .text(`Total Records: ${records.length}`);
        doc.moveDown(1.5);

        // Records table
        doc.fontSize(14).font('Helvetica-Bold').text('Records');
        doc.moveDown(0.5);

        // Table headers
        const tableTop = doc.y;
        const colWidths = [40, 220, 140, 110];
        const headers = ['#', 'Title', 'Category', 'Date'];

        doc.fontSize(9).font('Helvetica-Bold');
        let xPos = 40;
        headers.forEach((header, i) => {
            doc.text(header, xPos, tableTop, {
                width: colWidths[i],
                continued: false,
            });
            xPos += colWidths[i];
        });

        doc
            .moveTo(40, tableTop + 14)
            .lineTo(555, tableTop + 14)
            .stroke();

        // Table rows
        doc.font('Helvetica').fontSize(8);
        let yPos = tableTop + 20;

        records.forEach((record, index) => {
            if (yPos > 750) {
                doc.addPage();
                yPos = 40;
            }

            xPos = 40;
            const row = [
                `${index + 1}`,
                record.title.substring(0, 30),
                record.category ? record.category.name : '-',
                record.date ? new Date(record.date).toLocaleDateString() : '-',
            ];

            row.forEach((cell, i) => {
                doc.text(cell, xPos, yPos, {
                    width: colWidths[i],
                    continued: false,
                });
                xPos += colWidths[i];
            });

            yPos += 16;
        });

        // Footer
        doc.moveDown(2);
        doc
            .fontSize(8)
            .fillColor('#888')
            .text('— End of Report —', { align: 'center' });

        doc.end();

    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Export report to CSV
 * @route   GET /api/reports/csv
 * @access  Private
 */
const exportCSV = async (req, res, next) => {
    try {
        const filter = buildReportFilter(req.query, req.user);

        const records = await Record.find(filter)
            .populate('category', 'name')
            .sort({ date: -1 });

        // CSV header
        let csv = 'Title,Description,Date,Category,Created At\n';

        // CSV rows — escapeCsvField guards against formula injection
        records.forEach((r) => {
            const row = [
                `"${escapeCsvField(r.title || '')}"`,
                `"${escapeCsvField(r.description || '')}"`,
                r.date ? new Date(r.date).toLocaleDateString() : '',
                `"${escapeCsvField(r.category ? r.category.name : '')}"`,
                r.createdAt ? new Date(r.createdAt).toLocaleString() : '',
            ];
            csv += row.join(',') + '\n';
        });

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader(
            'Content-Disposition',
            `attachment; filename=report_${Date.now()}.csv`
        );
        res.send(csv);
    } catch (error) {
        next(error);
    }
};

module.exports = { getReport, exportPDF, exportCSV, getDistinctYears };
