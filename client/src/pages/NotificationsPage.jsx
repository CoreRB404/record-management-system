import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';
import { notificationService } from '../services/dataService';
import { IoMailOpen, IoRefresh, IoSend, IoSave } from 'react-icons/io5';

const parseEmails = (value) => {
    if (!value) return [];
    const items = value
        .split(',')
        .map((email) => email.trim().toLowerCase())
        .filter(Boolean);
    return Array.from(new Set(items));
};

const NotificationsPage = () => {
    const [loadingSettings, setLoadingSettings] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState({ enabled: true, emails: [] });
    const [emailInput, setEmailInput] = useState('');

    const [loadingDrafts, setLoadingDrafts] = useState(true);
    const [drafts, setDrafts] = useState([]);
    const [draftMeta, setDraftMeta] = useState({ month: null, day: null, timezone: 'UTC' });
    const [sending, setSending] = useState(false);

    const loadSettings = async () => {
        setLoadingSettings(true);
        try {
            const res = await notificationService.getEmailSettings();
            const data = res.data.data;
            setSettings({
                enabled: Boolean(data.enabled),
                emails: Array.isArray(data.emails) ? data.emails : [],
            });
            setEmailInput((data.emails || []).join(', '));
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to load notification settings');
        } finally {
            setLoadingSettings(false);
        }
    };

    const loadDrafts = async () => {
        setLoadingDrafts(true);
        try {
            const res = await notificationService.getTodayDrafts();
            const data = res.data.data;
            setDrafts(data.drafts || []);
            setDraftMeta(data.date || { month: null, day: null, timezone: 'UTC' });
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to load drafts');
        } finally {
            setLoadingDrafts(false);
        }
    };

    useEffect(() => {
        loadSettings();
        loadDrafts();
    }, []);

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const emails = parseEmails(emailInput);
            const payload = { enabled: settings.enabled, emails };
            const res = await notificationService.updateEmailSettings(payload);
            const data = res.data.data;
            setSettings({
                enabled: Boolean(data.enabled),
                emails: Array.isArray(data.emails) ? data.emails : [],
            });
            setEmailInput((data.emails || []).join(', '));
            toast.success('Notification settings saved');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    const handleSendToday = async () => {
        setSending(true);
        try {
            const res = await notificationService.sendTodayDrafts();
            toast.success(res.data.message || 'Drafts sent');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to send drafts');
        } finally {
            setSending(false);
        }
    };

    const formattedDate = draftMeta.month && draftMeta.day
        ? `${draftMeta.month}/${draftMeta.day} (${draftMeta.timezone || 'UTC'})`
        : 'Not available';

    const emailList = parseEmails(emailInput);

    return (
        <div className="notifications-page">
            <div className="page-header">
                <div>
                    <h1>Notifications</h1>
                    <p className="page-subtitle">Manage email recipients and preview post drafts</p>
                </div>
            </div>

            <div className="charts-grid notifications-grid">
                <div className="chart-card">
                    <h3 className="chart-title"><IoMailOpen style={{ marginRight: 8 }} /> Email notifications</h3>
                    {loadingSettings ? (
                        <LoadingSpinner text="Loading settings..." />
                    ) : (
                        <form className="modal-form" onSubmit={handleSave}>
                            <div className="form-group notification-toggle">
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={settings.enabled}
                                        onChange={(e) => setSettings({ ...settings, enabled: e.target.checked })}
                                    />
                                    Enable daily email notifications
                                </label>
                            </div>
                            <div className="form-group">
                                <label>Recipient emails (comma separated)</label>
                                <textarea
                                    rows={3}
                                    value={emailInput}
                                    onChange={(e) => setEmailInput(e.target.value)}
                                    placeholder="email1@example.com, email2@example.com"
                                />
                                {emailList.length > 0 && (
                                    <div className="email-chip-list">
                                        {emailList.map((email) => (
                                            <span key={email} className="email-chip">{email}</span>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="modal-actions">
                                <button type="submit" className="btn btn-primary" disabled={saving}>
                                    <IoSave /> {saving ? 'Saving...' : 'Save settings'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>

                <div className="chart-card">
                    <div className="notifications-header">
                        <h3 className="chart-title">Today draft previews</h3>
                        <span className="notification-date">{formattedDate}</span>
                    </div>
                    <div className="notification-actions">
                        <button className="btn btn-outline" onClick={loadDrafts} disabled={loadingDrafts}>
                            <IoRefresh /> Refresh
                        </button>
                        <button className="btn btn-primary" onClick={handleSendToday} disabled={sending}>
                            <IoSend /> {sending ? 'Sending...' : 'Send drafts'}
                        </button>
                    </div>

                    {loadingDrafts ? (
                        <LoadingSpinner text="Loading drafts..." />
                    ) : drafts.length === 0 ? (
                        <div className="empty-state">
                            <IoMailOpen className="empty-icon" />
                            <h3>No drafts today</h3>
                            <p>Add records dated today to generate drafts.</p>
                        </div>
                    ) : (
                        <div className="draft-list">
                            {drafts.map((draft) => (
                                <div key={draft.id} className="draft-card">
                                    <div className="draft-title">{draft.title}</div>
                                    <div className="draft-meta">Type: {draft.typeLabel} | Date: {draft.dateLabel}</div>
                                    <div className="draft-message">{draft.message}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default NotificationsPage;
