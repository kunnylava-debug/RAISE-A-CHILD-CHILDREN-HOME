import React, { useState, useEffect, useCallback } from 'react';
import { 
  X, CheckCircle2, Download, Handshake, Heart, Clock,
  CreditCard, ShieldCheck, Loader2, Sparkles, AlertCircle
} from 'lucide-react';
import NeededItemsTable from '../components/NeededItemsTable';
import SupportSection from '../components/SupportSection';
import SupportersWall from '../components/SupportersWall';
import CelebrationBlastModal from '../components/CelebrationBlastModal';
import GeneralDonationCard from '../components/GeneralDonationCard';
import { api, subscribeToRealtimeSync } from '../services/api';
import { useAdminAuth } from '../context/AdminAuthContext';

export default function Needed({ settings, onShowToast }) {
  const [neededItems, setNeededItems] = useState([]);
  const [supporters, setSupporters] = useState([]);

  // Donation / Pledge modal
  const [pledgeItem, setPledgeItem] = useState(null);
  const [modalMode, setModalMode] = useState('donate'); // 'donate' | 'pledge'
  const [donationModalOpen, setDonationModalOpen] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [simulationOrder, setSimulationOrder] = useState(null);
  const [donationForm, setDonationForm] = useState({
    donor_name: '',
    donor_phone: '',
    donor_email: '',
    amount: '',
    payment_method: 'UPI',
    transaction_ref: '',
    notes: '',
    needed_item_id: null,
    quantity_donated: 1
  });
  const [donationReceipt, setDonationReceipt] = useState(null);

  // Celebration blast state when need is fulfilled
  const [celebrationBlastOpen, setCelebrationBlastOpen] = useState(false);
  const [celebrationData, setCelebrationData] = useState({
    itemName: '',
    donorName: '',
    quantityDonated: 1,
    totalNeeded: 1,
    receiptNo: ''
  });

  // Admin Modals
  const [editNeedOpen, setEditNeedOpen] = useState(false);
  const [currentNeed, setCurrentNeed] = useState(null);

  const [editSupporterOpen, setEditSupporterOpen] = useState(false);
  const [currentSupporter, setCurrentSupporter] = useState(null);

  const { adminUser } = useAdminAuth();

  const fetchData = useCallback(() => {
    Promise.all([
      api.getNeededItems(), 
      api.getSupporters(),
      api.getDonations().catch(() => [])
    ])
      .then(([items, supps, donationsList]) => {
        const rawItems = Array.isArray(items) && items.length > 0 ? items : [];
        const donList = Array.isArray(donationsList) ? donationsList : [];

        // Dynamically compute live quantity_received based strictly on confirmed donations
        // Pledges that are still pending verification do NOT count towards received!
        const computedItems = rawItems.map(item => {
          const matchingConfirmedDonations = donList.filter(d => {
            const matchesId = d.needed_item_id && String(d.needed_item_id) === String(item.id);
            const donName = d.linked_need_title || d.item_name;
            const matchesName = donName && item.item_name && 
              donName.toLowerCase().trim() === item.item_name.toLowerCase().trim();
            const isMatch = matchesId || matchesName;

            // Only count if confirmed (or direct donation). Pending pledges are excluded!
            const isConfirmed = d.status === 'Confirmed' || 
                                (d.entry_type === 'Direct Donation' && d.status !== 'Cancelled') ||
                                (!d.status && !d.entry_type);
            return isMatch && isConfirmed;
          });

          const confirmedQty = matchingConfirmedDonations.reduce((sum, d) => sum + (Number(d.quantity_donated) || 1), 0);
          const totalReceived = Math.max(Number(item.quantity_received) || 0, confirmedQty);
          const isFulfilled = totalReceived >= Number(item.quantity_needed);

          return {
            ...item,
            quantity_received: totalReceived,
            is_fulfilled: isFulfilled
          };
        });

        // 1. Sort newest first so freshly added items go to the TOP
        computedItems.sort((a, b) => {
          const timeA = new Date(a.created_at || 0).getTime() || (Number(a.id) || 0);
          const timeB = new Date(b.created_at || 0).getTime() || (Number(b.id) || 0);
          return timeB - timeA;
        });

        // 2. Automatically remove/hide fulfilled items from the public site
        const publicItems = computedItems.filter(item => !item.is_fulfilled);

        setNeededItems(publicItems);
        setSupporters(supps || []);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    fetchData();

    const unsubscribe = subscribeToRealtimeSync((event) => {
      if (event.type === 'NEEDED_UPDATED' || event.type === 'DONATIONS_UPDATED') {
        console.log('[REAL-TIME SYNC] Needs/Donations updated, re-computing live counts...');
        fetchData();
      }
    });

    // 3-second active polling interval: updates automatically across mobile and desktop
    const interval = setInterval(() => {
      fetchData();
    }, 3000);

    // Instant update whenever user switches back to this tab or unlocks mobile phone screen
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        fetchData();
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onVisible);

    return () => {
      unsubscribe();
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onVisible);
    };
  }, [fetchData]);

  const handleCopy = (text, label) => {
    navigator.clipboard.writeText(text);
    onShowToast?.({ type: 'success', message: `${label} copied to clipboard!` });
  };

  const handleOpenModal = (item, mode = 'donate', customAmount = null) => {
    setPledgeItem(item);
    setModalMode(mode);
    setDonationReceipt(null);

    const defaultAmount = customAmount 
      ? Number(customAmount) 
      : (item 
          ? Math.max(1, Math.round((item.estimated_price || 1000) / (item.quantity_needed || 1)))
          : 250);

    setDonationForm({
      donor_name: '',
      donor_phone: '',
      donor_email: '',
      amount: defaultAmount,
      payment_method: mode === 'pledge' ? 'Pledge to Deliver Items' : 'UPI',
      transaction_ref: '',
      notes: mode === 'pledge' 
        ? `Pledge commitment for 1 unit of: ${item?.item_name || 'General Need'}` 
        : (item ? `Direct contribution for 1 unit of: ${item.item_name}` : `General Donation for Children Care & Meals`),
      needed_item_id: item?.id || null,
      linked_need_title: item?.item_name || 'General Student Care & Meals',
      quantity_donated: 1
    });
    setDonationModalOpen(true);
  };

  const handleVerifiedSuccess = (verifyRes, targetItem, qty) => {
    const receiptData = verifyRes.receipt || verifyRes.donation || verifyRes;
    let needFulfilledByThisDonation = false;

    if (targetItem) {
      const curRec = Number(targetItem.quantity_received) || 0;
      const totalReq = Number(targetItem.quantity_needed) || 1;
      if (curRec + qty >= totalReq || verifyRes.updated_need?.is_fulfilled) {
        needFulfilledByThisDonation = true;
      }
    }

    if (needFulfilledByThisDonation) {
      receiptData.is_fulfilled_by_donation = true;
      receiptData.quantity_needed = targetItem?.quantity_needed || verifyRes?.updated_need?.quantity_needed || 1;
    }

    setDonationReceipt(receiptData);

    // Trigger Celebration Blast Modal & Fanfare Chime!
    if (needFulfilledByThisDonation) {
      setCelebrationData({
        itemName: targetItem?.item_name || verifyRes?.updated_need?.item_name || 'Hostel Requirement',
        donorName: receiptData.donor_name || 'Generous Well-Wisher',
        quantityDonated: qty,
        totalNeeded: targetItem?.quantity_needed || verifyRes?.updated_need?.quantity_needed || 1,
        receiptNo: receiptData.receipt_no || ''
      });
      setCelebrationBlastOpen(true);
    }

    onShowToast?.({
      type: 'success',
      title: needFulfilledByThisDonation ? '🎉 Need 100% Fulfilled!' : 'Payment Verified & Confirmed!',
      message: needFulfilledByThisDonation
        ? 'By your contribution, this need is fulfilled! Thank you so much for your generosity!'
        : 'Thank you for your donation! Your payment has been successfully verified.'
    });

    fetchData();

    setDonationForm({
      donor_name: '',
      donor_phone: '',
      donor_email: '',
      amount: '',
      payment_method: 'UPI',
      transaction_ref: '',
      notes: '',
      needed_item_id: null,
      quantity_donated: 1
    });
  };

  const handleExecuteSimulation = async () => {
    if (!simulationOrder) return;
    try {
      setPaymentProcessing(true);
      const { orderRes, targetItem, qty } = simulationOrder;
      const verifyRes = await api.verifyPayment({
        donation_id: orderRes.donation_id,
        razorpay_order_id: orderRes.order_id,
        razorpay_payment_id: `pay_sim_${Date.now()}`,
        razorpay_signature: 'simulated_test_signature'
      });

      setSimulationOrder(null);
      if (verifyRes.success) {
        handleVerifiedSuccess(verifyRes, targetItem, qty);
      } else {
        throw new Error(verifyRes.error || 'Test payment verification failed.');
      }
    } catch (err) {
      onShowToast?.({ type: 'error', message: err.message || 'Simulation error.' });
    } finally {
      setPaymentProcessing(false);
    }
  };

  const handleDonationSubmit = async (e) => {
    e.preventDefault();
    const isPledge = modalMode === 'pledge';
    const qty = pledgeItem ? Number(donationForm.quantity_donated || 1) : 1;
    const amountVal = Number(donationForm.amount);

    if (!donationForm.donor_name.trim()) {
      onShowToast?.({ type: 'error', message: 'Please enter your full name.' });
      return;
    }

    if (!donationForm.donor_phone.trim()) {
      onShowToast?.({ type: 'error', message: 'Please enter your phone number for transaction verification.' });
      return;
    }

    if (!isPledge && (isNaN(amountVal) || amountVal < 1)) {
      onShowToast?.({ type: 'error', message: 'Donation amount must be at least ₹1.' });
      return;
    }

    // 1. IF PLEDGE COMMITMENT: Register offline pledge (Pending Admin Confirmation)
    if (isPledge) {
      try {
        setPaymentProcessing(true);
        const payload = {
          ...donationForm,
          entry_type: 'Pledge',
          status: 'Pledged (Pending Admin Confirmation)',
          needed_item_id: pledgeItem ? pledgeItem.id : (donationForm.needed_item_id || null),
          linked_need_title: pledgeItem ? pledgeItem.item_name : (donationForm.linked_need_title || null),
          quantity_donated: qty
        };

        const res = await api.recordDonation(payload);
        const receiptData = res?.receipt || res?.donation || res || payload;
        setDonationReceipt(receiptData);

        onShowToast?.({
          type: 'success',
          title: 'Pledge Commitment Registered',
          message: 'Thank you for your generous pledge! As required, received units will remain unchanged until our administrator speaks with you and confirms receipt.'
        });

        fetchData();
      } catch (err) {
        onShowToast?.({ type: 'error', message: err.message || 'Failed to register pledge.' });
      } finally {
        setPaymentProcessing(false);
      }
      return;
    }

    // 2. IF ONLINE DONATION: Server Order + Official Razorpay Payment Gateway Flow
    try {
      setPaymentProcessing(true);
      const targetItem = pledgeItem || neededItems.find(it => String(it.id) === String(donationForm.needed_item_id));

      const orderPayload = {
        donor_name: donationForm.donor_name.trim(),
        donor_phone: donationForm.donor_phone.trim(),
        donor_email: donationForm.donor_email.trim(),
        amount: amountVal,
        needed_item_id: targetItem ? targetItem.id : null,
        item_name: targetItem ? targetItem.item_name : (donationForm.linked_need_title || 'General Donation'),
        linked_need_title: targetItem ? targetItem.item_name : (donationForm.linked_need_title || 'General Donation'),
        quantity_donated: qty,
        notes: donationForm.notes.trim()
      };

      // Create unique server donation record with status PENDING & get Razorpay order
      const orderRes = await api.createPaymentOrder(orderPayload);

      if (orderRes.is_live_gateway && orderRes.key_id) {
        // Load official Razorpay Checkout SDK dynamically
        const scriptLoaded = await new Promise((resolve) => {
          if (window.Razorpay) return resolve(true);
          const script = document.createElement('script');
          script.src = 'https://checkout.razorpay.com/v1/checkout.js';
          script.onload = () => resolve(true);
          script.onerror = () => resolve(false);
          document.body.appendChild(script);
        });

        if (!scriptLoaded) {
          throw new Error('Could not load Razorpay checkout script. Please check your connection.');
        }

        const options = {
          key: orderRes.key_id,
          amount: orderRes.amount_paise,
          currency: 'INR',
          name: 'RISE A CHILD Welfare Trust',
          description: `Donation: ${orderPayload.item_name}`,
          image: '/logo.png',
          order_id: orderRes.order_id,
          prefill: {
            name: orderPayload.donor_name,
            contact: orderPayload.donor_phone,
            email: orderPayload.donor_email
          },
          theme: {
            color: '#059669' // Emerald
          },
          handler: async function (response) {
            // Cryptographic HMAC-SHA256 server verification
            try {
              setPaymentProcessing(true);
              const verifyRes = await api.verifyPayment({
                donation_id: orderRes.donation_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              });

              if (verifyRes.success) {
                handleVerifiedSuccess(verifyRes, targetItem, qty);
              } else {
                throw new Error(verifyRes.error || 'Payment signature verification failed.');
              }
            } catch (err) {
              onShowToast?.({
                type: 'error',
                title: 'Verification Failed',
                message: err.message || 'Payment signature could not be verified on the server.'
              });
            } finally {
              setPaymentProcessing(false);
            }
          },
          modal: {
            ondismiss: function () {
              setPaymentProcessing(false);
              onShowToast?.({
                type: 'info',
                title: 'Payment Window Closed',
                message: 'Payment process was interrupted. The donation remains unconfirmed.'
              });
            }
          }
        };

        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', function (failRes) {
          setPaymentProcessing(false);
          onShowToast?.({
            type: 'error',
            title: 'Payment Failed',
            message: failRes.error?.description || 'Your bank or payment provider declined the transaction.'
          });
        });
        rzp.open();
      } else {
        // When RAZORPAY_KEY_ID is not yet configured in environment variables,
        // present sandbox simulation modal so testing and verification work end-to-end
        setSimulationOrder({
          orderRes,
          targetItem,
          qty
        });
        setPaymentProcessing(false);
      }
    } catch (err) {
      setPaymentProcessing(false);
      onShowToast?.({ type: 'error', message: err.message || 'Payment failed to initiate.' });
    }
  };

  const handleSaveNeed = async (e) => {
    e.preventDefault();
    const isEdit = Boolean(currentNeed.id);
    const needToSave = { ...currentNeed };
    setEditNeedOpen(false);

    if (isEdit) {
      setNeededItems(prev => prev.map(item => String(item.id) === String(needToSave.id) ? { ...item, ...needToSave } : item));
      onShowToast?.({ type: 'success', message: 'Item updated' });
    } else {
      const tempItem = { ...needToSave, id: Date.now() };
      setNeededItems(prev => [...prev, tempItem]);
      onShowToast?.({ type: 'success', message: 'Need item added' });
    }

    try {
      if (isEdit) {
        await api.updateNeededItem(needToSave.id, needToSave);
      } else {
        await api.createNeededItem(needToSave);
      }
      fetchData(false);
    } catch (err) {
      onShowToast?.({ type: 'error', message: err.message });
      fetchData(false);
    }
  };

  const handleDeleteNeed = async (id) => {
    if (!window.confirm('Delete this item from needed list?')) return;
    setNeededItems(prev => prev.filter(item => String(item.id) !== String(id)));
    onShowToast?.({ type: 'success', message: 'Item removed' });

    try {
      await api.deleteNeededItem(id);
      fetchData(false);
    } catch (err) {
      onShowToast?.({ type: 'error', message: err.message });
      fetchData(false);
    }
  };

  const handleSaveSupporter = async (e) => {
    e.preventDefault();
    try {
      if (currentSupporter.id) {
        await api.updateSupporter(currentSupporter.id, currentSupporter);
        onShowToast?.({ type: 'success', message: 'Supporter profile updated' });
      } else {
        await api.createSupporter(currentSupporter);
        onShowToast?.({ type: 'success', message: 'New supporter added' });
      }
      setEditSupporterOpen(false);
      fetchData();
    } catch (err) {
      onShowToast?.({ type: 'error', message: err.message });
    }
  };

  const handleDeleteSupporter = async (id) => {
    if (!window.confirm('Remove supporter profile?')) return;
    try {
      await api.deleteSupporter(id);
      onShowToast?.({ type: 'success', message: 'Supporter removed' });
      fetchData();
    } catch (err) {
      onShowToast?.({ type: 'error', message: err.message });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-12 sm:space-y-16">
      {/* 1. TOP GENERAL DONATIONS BLOCK (Can't sponsor a full unit? Donate any amount) */}
      <GeneralDonationCard
        settings={settings}
        onOpenGeneralDonation={(amount) => handleOpenModal(null, 'donate', amount)}
        onCopy={handleCopy}
      />

      {/* 2. SPECIFIC NEEDED ITEMS TABLE */}
      <NeededItemsTable
        neededItems={neededItems}
        adminUser={adminUser}
        onDirectDonate={(item) => handleOpenModal(item, 'donate')}
        onMakePledge={(item) => handleOpenModal(item, 'pledge')}
        onPledge={(item, mode = 'donate') => handleOpenModal(item, mode)}
        onAddNeed={() => {
          setCurrentNeed({
            item_name: '',
            category: 'Education',
            quantity_needed: 10,
            quantity_received: 0,
            estimated_price: 5000,
            urgency: 'High',
            description: ''
          });
          setEditNeedOpen(true);
        }}
        onEditNeed={(item) => {
          setCurrentNeed(item);
          setEditNeedOpen(true);
        }}
        onDeleteNeed={handleDeleteNeed}
      />

      <SupportSection
        settings={settings}
        onOpenDonationModal={() => handleOpenModal(null, 'donate')}
        onCopy={handleCopy}
      />

      <SupportersWall
        supporters={supporters}
        adminUser={adminUser}
        onAddSupporter={() => {
          setCurrentSupporter({
            name: '',
            occupation: '',
            support_type: '',
            photo_url: '',
            message: '',
            date_supported: new Date().toLocaleString('default', { month: 'long', year: 'numeric' })
          });
          setEditSupporterOpen(true);
        }}
        onEditSupporter={(sup) => {
          setCurrentSupporter(sup);
          setEditSupporterOpen(true);
        }}
        onDeleteSupporter={handleDeleteSupporter}
      />

      {/* Donation / Pledge Modal */}
      {donationModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-lg rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 max-h-[92vh] overflow-y-auto space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900 font-serif flex items-center space-x-2">
                  {modalMode === 'pledge' ? (
                    <>
                      <Handshake className="w-5 h-5 text-amber-600 inline" />
                      <span>Make a Pledge Commitment</span>
                    </>
                  ) : (
                    <>
                      <Heart className="w-5 h-5 text-emerald-600 inline" />
                      <span>Direct Donation & Support</span>
                    </>
                  )}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {pledgeItem ? `Item: ${pledgeItem.item_name}` : 'General Donation (Student Care, Food & Nutritious Meals)'}
                </p>
              </div>
              <button 
                onClick={() => { setDonationModalOpen(false); setDonationReceipt(null); }} 
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mode Explanation Banner */}
            {modalMode === 'pledge' ? (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 text-xs space-y-1.5 text-amber-900">
                <div className="flex items-center space-x-2 font-bold text-amber-900">
                  <Clock className="w-4 h-4 text-amber-700 flex-shrink-0" />
                  <span>Pledge Policy: Admin Verification Required</span>
                </div>
                <p className="text-amber-800 text-[11px] leading-relaxed">
                  Thank you for promising to sponsor this item! <strong>Received units will NOT change</strong> right now. Our administrator (Bro. Nelson) will call you to coordinate delivery/payment, and upon receipt, will confirm it in the Admin console to increment the count.
                </p>
              </div>
            ) : (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 text-xs space-y-1.5 text-emerald-950">
                <div className="flex items-center space-x-2 font-bold text-emerald-900">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>{pledgeItem ? 'Direct Donation: Instant Inventory Update' : '💖 General Student Care Donation'}</span>
                </div>
                <p className="text-emerald-800 text-[11px] leading-relaxed">
                  {pledgeItem
                    ? "Your direct donation will immediately increment the received count and decrease the remaining requirement in real-time across all devices."
                    : "Your general contribution directly provides hot nutritious meals, daily snacks, milk, and stationery supplies for our resident children. Every rupee counts!"}
                </p>
              </div>
            )}

            {/* Matched Need Info */}
            {pledgeItem && (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">
                    {pledgeItem.item_name}
                  </span>
                  <span className="bg-slate-200 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {pledgeItem.category}
                  </span>
                </div>
                <p className="text-slate-600">
                  Progress: <strong>{pledgeItem.quantity_received || 0}</strong> of <strong>{pledgeItem.quantity_needed}</strong> units collected.
                </p>
                <div className="flex items-center space-x-3 pt-1">
                  <label className="font-semibold text-slate-800">
                    Units {modalMode === 'pledge' ? 'pledging' : 'sponsoring'}:
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={Math.max(1, (pledgeItem.quantity_needed || 10) - (pledgeItem.quantity_received || 0))}
                    value={donationForm.quantity_donated || 1}
                    onChange={(e) => {
                      const qty = Math.max(1, Number(e.target.value) || 1);
                      const unitCost = Math.max(1, Math.round((pledgeItem.estimated_price || 1000) / (pledgeItem.quantity_needed || 1)));
                      setDonationForm({
                        ...donationForm,
                        quantity_donated: qty,
                        amount: unitCost * qty,
                        notes: modalMode === 'pledge'
                          ? `Pledge commitment for ${qty} unit(s) of: ${pledgeItem.item_name}`
                          : `Direct contribution for ${qty} unit(s) of: ${pledgeItem.item_name}`
                      });
                    }}
                    className="w-20 p-1.5 bg-white border border-slate-300 rounded-lg text-center font-bold text-slate-900"
                  />
                  <span className="text-slate-500 text-[11px]">
                    (≈ ₹{Math.max(1, Math.round((pledgeItem.estimated_price || 1000) / (pledgeItem.quantity_needed || 1)))}/unit)
                  </span>
                </div>
              </div>
            )}

            {donationReceipt ? (
              <div className="text-center space-y-4 py-3">
                <div className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center shadow-sm ${
                  modalMode === 'pledge' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-600'
                }`}>
                  {modalMode === 'pledge' ? (
                    <Handshake className="w-9 h-9" />
                  ) : (
                    <CheckCircle2 className="w-10 h-10" />
                  )}
                </div>

                <div>
                  <h4 className="text-xl font-bold font-serif text-slate-900">
                    {modalMode === 'pledge' ? 'Pledge Registered!' : 'Thank you for your donation!'}
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-sm mx-auto font-medium">
                    {modalMode === 'pledge'
                      ? 'Our administrator Bro. Nelson will call you shortly to verify and coordinate delivery.'
                      : 'Your payment has been successfully verified.'}
                  </p>
                </div>

                {/* Celebratory Fulfillment Card inside Receipt */}
                {donationReceipt.is_fulfilled_by_donation && (
                  <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white rounded-2xl p-4 shadow-lg border-2 border-emerald-300 text-center space-y-1.5 max-w-sm mx-auto">
                    <div className="inline-flex items-center space-x-1.5 bg-white/20 text-white text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full">
                      <span>🎉 Goal 100% Completed! ✨</span>
                    </div>
                    <h5 className="text-sm sm:text-base font-black leading-snug">
                      By your contribution this need is fulfilled!
                    </h5>
                    <p className="text-xs text-emerald-100 leading-relaxed">
                      All required units have been completely gathered! Heartfelt gratitude from all our children! 💖
                    </p>
                    <button
                      type="button"
                      onClick={() => setCelebrationBlastOpen(true)}
                      className="mt-1 text-[11px] underline text-emerald-100 hover:text-white font-bold inline-flex items-center space-x-1 cursor-pointer"
                    >
                      <span>Replay celebration blast effect 🎆</span>
                    </button>
                  </div>
                )}

                <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 text-left text-xs space-y-2.5 max-w-sm mx-auto shadow-xs">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Electronic Receipt</span>
                    <span className="font-mono font-bold text-blue-600">{donationReceipt.receipt_no}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Donation ID:</span>
                    <span className="font-mono text-slate-700 font-bold">{donationReceipt.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Donor Name:</span>
                    <span className="font-bold text-slate-800">{donationReceipt.donor_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Amount:</span>
                    <span className="font-bold text-emerald-700 text-sm">
                      {donationReceipt.amount ? `₹${Number(donationReceipt.amount).toLocaleString('en-IN')}` : 'In-kind'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Payment Method:</span>
                    <span className="font-semibold text-slate-700">{donationReceipt.payment_method || (modalMode === 'pledge' ? 'Pledge' : 'Razorpay UPI/Card')}</span>
                  </div>
                  {donationReceipt.transaction_ref && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Transaction ID:</span>
                      <span className="font-mono text-[11px] text-slate-600 truncate max-w-[170px]" title={donationReceipt.transaction_ref}>
                        {donationReceipt.transaction_ref}
                      </span>
                    </div>
                  )}
                  {donationReceipt.linked_need_title && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Supported Need:</span>
                      <span className="font-medium text-slate-700 truncate max-w-[170px]" title={donationReceipt.linked_need_title}>
                        {donationReceipt.linked_need_title}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-1 border-t border-slate-100">
                    <span className="text-slate-500">Payment Status:</span>
                    <span className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                      modalMode === 'pledge' 
                        ? 'bg-amber-100 text-amber-800' 
                        : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {modalMode === 'pledge' ? 'Pending Admin Verification' : 'CONFIRMED (Verified)'}
                    </span>
                  </div>
                  <div className="pt-1 text-[10px] text-slate-400 italic text-center">
                    Official donation receipt from RISE A CHILD CHILDREN HOME.
                  </div>
                </div>

                <div className="flex flex-wrap justify-center gap-2.5 pt-2">
                  <a
                    href={`https://wa.me/919059491777?text=${encodeURIComponent(
                      modalMode === 'pledge'
                        ? `Hello Bro. Nelson A, I have made a PLEDGE of ${donationReceipt.quantity_donated || 1} units of "${donationReceipt.linked_need_title || donationReceipt.item_name || 'Materials'}" for RISE A CHILD CHILDREN HOME (Ref: ${donationReceipt.receipt_no}, Name: ${donationReceipt.donor_name}). Please let me know how to deliver/transfer.`
                        : `Hello Bro. Nelson A, I have recorded a direct donation of ₹${donationReceipt.amount} for RISE A CHILD CHILDREN HOME (Receipt No: ${donationReceipt.receipt_no}, Donor: ${donationReceipt.donor_name}).`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center space-x-1.5 transition shadow-sm"
                  >
                    <span>WhatsApp Founder (+91 90594 91777)</span>
                  </a>
                  <button 
                    onClick={() => window.print()} 
                    className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center space-x-1.5 transition shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Print Slip</span>
                  </button>
                  <button 
                    onClick={() => { setDonationModalOpen(false); setDonationReceipt(null); }} 
                    className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold px-4 py-2 rounded-xl text-xs transition"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {simulationOrder && (
                  <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 space-y-2.5 animate-in fade-in">
                    <div className="flex items-center space-x-2 text-amber-900 font-bold text-xs sm:text-sm">
                      <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                      <span>Gateway Sandbox Mode (Order #{simulationOrder.orderRes.receipt_no})</span>
                    </div>
                    <p className="text-[11px] sm:text-xs text-amber-800 leading-relaxed">
                      Unique pending donation ID <strong className="font-mono">{simulationOrder.orderRes.donation_id}</strong> was registered on the server. Live keys can be added in Vercel environment variables. Click below to simulate a cryptographically verified confirmation test end-to-end:
                    </p>
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <button
                        type="button"
                        disabled={paymentProcessing}
                        onClick={handleExecuteSimulation}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center space-x-1.5 shadow-sm transition cursor-pointer disabled:opacity-50"
                      >
                        {paymentProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                        <span>Verify & Confirm Test Payment</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setSimulationOrder(null)}
                        className="px-3 py-2 text-slate-600 hover:bg-slate-200 rounded-xl text-xs font-semibold transition"
                      >
                        Cancel Test
                      </button>
                    </div>
                  </div>
                )}

                <form onSubmit={handleDonationSubmit} className="space-y-3.5 text-xs sm:text-sm">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Your Full Name *</label>
                    <input
                      type="text"
                      required
                      value={donationForm.donor_name}
                      onChange={e => setDonationForm({ ...donationForm, donor_name: e.target.value })}
                      placeholder="Enter your full name"
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Phone Number (For Verification Call) *
                      </label>
                      <input
                        type="tel"
                        required
                        value={donationForm.donor_phone}
                        onChange={e => setDonationForm({ ...donationForm, donor_phone: e.target.value })}
                        placeholder="+91 90594 XXXXX"
                        className="w-full p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Email (For Electronic Receipt)</label>
                      <input
                        type="email"
                        value={donationForm.donor_email}
                        onChange={e => setDonationForm({ ...donationForm, donor_email: e.target.value })}
                        placeholder="donor@example.com"
                        className="w-full p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        {modalMode === 'pledge' ? 'Pledged Value / Amount (₹)' : 'Contribution Amount (₹) *'}
                      </label>
                      <input
                        type="number"
                        required={modalMode !== 'pledge'}
                        min="1"
                        value={donationForm.amount}
                        onChange={e => setDonationForm({ ...donationForm, amount: e.target.value })}
                        className="w-full p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        {modalMode === 'pledge' ? 'Pledge Fulfillment Mode' : 'Payment Method'}
                      </label>
                      <select
                        value={donationForm.payment_method}
                        onChange={e => setDonationForm({ ...donationForm, payment_method: e.target.value })}
                        className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white font-medium"
                      >
                        {modalMode === 'pledge' ? (
                          <>
                            <option value="Pledge to Deliver Items">Promise to bring/deliver physical goods</option>
                            <option value="Pledge to Pay Later">Promise to pay/transfer in coming days</option>
                            <option value="UPI">UPI / QR Code Transfer</option>
                            <option value="Bank Transfer">Bank Transfer (NEFT/IMPS)</option>
                            <option value="Cash / In-Person">Cash / In-Person Visit</option>
                          </>
                        ) : (
                          <>
                            <option value="UPI">UPI (Google Pay, PhonePe, Paytm, QR)</option>
                            <option value="Credit / Debit Card">Credit / Debit Card (Visa, RuPay, MasterCard)</option>
                            <option value="Net Banking">Net Banking (All Indian Banks)</option>
                            <option value="Bank Transfer">Bank Transfer (NEFT / IMPS)</option>
                          </>
                        )}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Notes / Instructions</label>
                    <textarea
                      rows="2"
                      value={donationForm.notes}
                      onChange={e => setDonationForm({ ...donationForm, notes: e.target.value })}
                      placeholder={modalMode === 'pledge' ? 'e.g. Will bring items on Sunday afternoon' : 'e.g. For children nutrition and schooling'}
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div className="pt-3 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100">
                    <button 
                      type="button" 
                      onClick={() => { setDonationModalOpen(false); setSimulationOrder(null); }} 
                      className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-50 transition order-2 sm:order-1 text-xs"
                    >
                      Cancel
                    </button>

                    {modalMode === 'pledge' ? (
                      <button 
                        type="submit" 
                        disabled={paymentProcessing}
                        className="px-5 py-2.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-bold rounded-xl shadow-md shadow-amber-200 transition flex items-center space-x-1.5 cursor-pointer order-1 sm:order-2 disabled:opacity-50"
                      >
                        {paymentProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Handshake className="w-4 h-4" />}
                        <span>Register Pledge (Pending Verification)</span>
                      </button>
                    ) : (
                      <button 
                        type="submit" 
                        disabled={paymentProcessing}
                        className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold rounded-xl shadow-md shadow-emerald-200 transition flex items-center space-x-1.5 cursor-pointer order-1 sm:order-2 disabled:opacity-50"
                      >
                        {paymentProcessing ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Connecting Gateway...</span>
                          </>
                        ) : (
                          <>
                            <CreditCard className="w-4 h-4" />
                            <span>Proceed to Online Payment</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  {modalMode !== 'pledge' && (
                    <div className="pt-1 text-center">
                      <div className="inline-flex items-center space-x-1.5 text-[11px] text-slate-500 bg-slate-50 px-3 py-1 rounded-full border border-slate-200">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                        <span>Instant automated confirmation via Razorpay Payment Gateway</span>
                      </div>
                    </div>
                  )}
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Admin Add/Edit Need Modal */}
      {editNeedOpen && currentNeed && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-100">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-bold text-slate-900 font-serif">
                {currentNeed.id ? 'Edit Needed Item' : 'Add New Needed Item'}
              </h3>
              <button onClick={() => setEditNeedOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveNeed} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Item Name *</label>
                <input
                  type="text"
                  required
                  value={currentNeed.item_name}
                  onChange={e => setCurrentNeed({ ...currentNeed, item_name: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Category</label>
                  <input
                    type="text"
                    value={currentNeed.category}
                    onChange={e => setCurrentNeed({ ...currentNeed, category: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Urgency</label>
                  <select
                    value={currentNeed.urgency || 'High'}
                    onChange={e => setCurrentNeed({ ...currentNeed, urgency: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Quantity Needed *</label>
                  <input
                    type="number"
                    required
                    value={currentNeed.quantity_needed}
                    onChange={e => setCurrentNeed({ ...currentNeed, quantity_needed: Number(e.target.value) || 1 })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Price (₹) *</label>
                  <input
                    type="number"
                    required
                    value={currentNeed.estimated_price}
                    onChange={e => setCurrentNeed({ ...currentNeed, estimated_price: Number(e.target.value) || 0 })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  rows="2"
                  value={currentNeed.description}
                  onChange={e => setCurrentNeed({ ...currentNeed, description: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
              <div className="pt-3 flex justify-end space-x-2">
                <button type="button" onClick={() => setEditNeedOpen(false)} className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 bg-emerald-600 text-white font-bold rounded-xl shadow">
                  Save Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin Add/Edit Supporter Modal */}
      {editSupporterOpen && currentSupporter && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-100">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-bold text-slate-900 font-serif">
                {currentSupporter.id ? 'Edit Supporter' : 'Add Supporter Profile'}
              </h3>
              <button onClick={() => setEditSupporterOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveSupporter} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Supporter Name *</label>
                <input
                  type="text"
                  required
                  value={currentSupporter.name}
                  onChange={e => setCurrentSupporter({ ...currentSupporter, name: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Occupation</label>
                <input
                  type="text"
                  value={currentSupporter.occupation}
                  onChange={e => setCurrentSupporter({ ...currentSupporter, occupation: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Support Contribution *</label>
                <input
                  type="text"
                  required
                  value={currentSupporter.support_type}
                  onChange={e => setCurrentSupporter({ ...currentSupporter, support_type: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Photo Image URL</label>
                <input
                  type="text"
                  value={currentSupporter.photo_url}
                  onChange={e => setCurrentSupporter({ ...currentSupporter, photo_url: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Message</label>
                <textarea
                  rows="2"
                  value={currentSupporter.message}
                  onChange={e => setCurrentSupporter({ ...currentSupporter, message: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
              <div className="pt-3 flex justify-end space-x-2">
                <button type="button" onClick={() => setEditSupporterOpen(false)} className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 bg-emerald-600 text-white font-bold rounded-xl shadow">
                  Save Supporter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Celebration Blast Modal when a need is fulfilled */}
      <CelebrationBlastModal
        isOpen={celebrationBlastOpen}
        onClose={() => setCelebrationBlastOpen(false)}
        itemName={celebrationData.itemName}
        donorName={celebrationData.donorName}
        quantityDonated={celebrationData.quantityDonated}
        totalNeeded={celebrationData.totalNeeded}
        receiptNo={celebrationData.receiptNo}
      />
    </div>
  );
}
