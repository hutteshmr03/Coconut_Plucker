import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

export const LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी', flag: '🇮🇳' }
];

export const TRANSLATIONS = {
  en: {
    // Brand
    brand_name: 'Coconut Plucker',
    brand_tagline: 'SKILLED HEIGHT WORK, ON DEMAND',
    brand_sub: 'Skilled height work on demand across Goa',

    // Auth
    tab_login: 'Log In',
    tab_signup: 'Sign Up',
    auth_otp_login_desc: 'Enter your registered Mobile Phone Number for instant OTP login.',
    auth_mobile_label: 'Phone Number',
    auth_mobile_placeholder: 'e.g. 984253XXX4',
    auth_mobile_hint: 'A 4-digit verification code will be sent to your mobile',
    auth_btn_send_otp: 'Send Login OTP',
    auth_btn_sending_otp: 'Sending OTP...',
    auth_switch_to_admin: 'Administrator & Super Admin Password Login',
    auth_switch_to_mobile: 'Back to Customer & Climber Mobile OTP Login',
    auth_otp_step_title: 'One-Time Password (OTP)',
    auth_otp_sent_to: 'Verification code sent to',
    auth_otp_hint: '',
    auth_btn_verify: 'Verify OTP & Log In',
    auth_btn_back: 'Back',
    auth_admin_title: 'Administrator Portal Sign In',
    auth_admin_desc: 'Authorized personnel credentials login (Platform Admin / Super Admin).',
    auth_admin_user_label: 'Administrator Mobile Number or Username',
    auth_admin_user_placeholder: 'e.g. 984253XXX4, admin, or superadmin',
    auth_admin_pass_label: 'Password',
    auth_admin_pass_placeholder: 'Enter password (e.g. admin123 or tempPassword123!)',
    auth_btn_admin_login: 'Log In as Administrator',
    
    // Sign Up
    signup_full_name: 'Full Name',
    signup_full_name_placeholder: 'e.g. Rohidas Naik',
    signup_phone: 'Phone Number',
    signup_phone_placeholder: 'e.g. 984253XXX4',
    signup_i_am: 'I am registering as:',
    signup_role_customer: 'Customer (Tree Owner / Property)',
    signup_role_climber: 'Professional Plucker (Climber)',
    signup_taluka: 'Taluka / District',
    signup_address: 'Address (with landmark)',
    signup_address_placeholder: 'House No, Village/Town, Landmark, Goa',
    signup_exp: 'Experience (Years)',
    signup_safety: 'Safety / Certification Details',
    signup_safety_placeholder: 'e.g. CPCRI Climber / 5+ yrs tree climbing',
    signup_btn_continue: 'Continue & Verify Phone',
    signup_btn_complete: 'Verify & Create Account',

    // Nav & Common Topbar
    nav_book_service: 'Book a Service',
    nav_my_bookings: 'My Bookings',
    nav_profile: 'Profile',
    nav_dashboard: 'Dashboard',
    nav_assigned_jobs: 'Assigned Jobs',
    nav_skills_safety: 'Skills & Safety Profile',
    nav_admin_overview: 'Operations Overview',
    nav_scheduling: 'Region Scheduling',
    nav_analytics: 'Analytics & Reports',
    nav_all_bookings: 'All Bookings',
    nav_workforce: 'Professional Workforce',
    nav_catalog: 'Service Catalog',
    nav_safety_incidents: 'Safety & Incidents',
    nav_admin_management: 'Administrator Management',
    nav_audit_trail: 'Platform Audit Trail',
    nav_super_profile: 'Security & Credentials',
    sign_out: 'Sign Out',
    verified: 'Verified',
    admin_badge: 'Admin',
    super_admin_badge: 'Super Admin',

    // Topbar titles
    top_book_service_title: 'Book a Service',
    top_book_service_sub: 'Book trusted local climbers for your trees in Goa.',
    top_my_bookings_title: 'My Bookings',
    top_my_bookings_sub: 'Track active bookings, payment, and submit professional reviews',
    top_cust_profile_title: 'Customer Profile',
    top_cust_profile_sub: 'Manage your contact details and default Taluka',
    top_pro_dash_title: 'Professional Dashboard',
    top_pro_dash_sub: 'Assigned bookings, pre-climb safety checklists, and job management',
    top_pro_jobs_title: 'Assigned Bookings',
    top_pro_jobs_sub: 'Perform pre-climb safety checklists, start jobs, and mark completion',
    top_pro_profile_title: 'Skills & Safety Profile',
    top_pro_profile_sub: 'Manage experience, safety certification, and service capabilities',
    top_adm_overview_title: 'Admin Operations Overview',
    top_adm_overview_sub: 'Live overview of bookings, workforce verification, and service metrics',
    top_adm_scheduling_title: 'Regional Scheduling Governance',
    top_adm_scheduling_sub: 'Manage Taluka schedule day mappings and daily dispatch capacity limits',
    top_adm_admins_title: 'Administrator Management',
    top_adm_admins_sub: 'Provision, configure, and deactivate platform administrator accounts',
    top_adm_audit_title: 'Platform-Wide Audit Trail',
    top_adm_audit_sub: 'Searchable log of all administrator operations and compliance events',
    top_adm_safety_title: 'Safety & Incident Reports',
    top_adm_safety_sub: 'Track near-misses, equipment audits, and field safety logs',
    top_adm_reports_title: 'Analytics & Revenue Reports',
    top_adm_reports_sub: 'Volume breakdown, revenue realization, and service demand',
    top_adm_profile_title: 'Administrator Profile',
    top_adm_profile_sub: 'Manage administrator account details, regional scope, and credentials',

    // Common UI
    btn_next: 'Next Step',
    btn_back: 'Back',
    btn_edit: 'Edit',
    btn_delete: 'Delete',
    btn_cancel: 'Cancel',
    btn_confirm: 'Confirm',
    btn_save: 'Save Changes',
    btn_submit: 'Submit',
    select_language: 'Language',
    status_active: 'Active',
    status_pending: 'Pending',
    status_completed: 'Completed',
    status_assigned: 'Assigned',
    status_in_progress: 'In Progress',
    status_cancelled: 'Cancelled',
    emergency_badge: 'Emergency Booking (24h SLA)',
    tree_count: 'Number of Trees',
    total_amount: 'Total Amount',
    pay_now: 'Pay Now',
    rupees: '₹',

    // Role & Taluka translation keys
    role_customer: 'Customer',
    role_professional: 'Professional Climber',
    role_admin: 'Admin',
    role_super_admin: 'Super Admin',
    taluka_north_goa: 'North Goa',
    taluka_south_goa: 'South Goa',
    taluka_kushavati: 'Kushavati',
    taluka_all: 'All Talukas',

    // Wizard Step Translation Keys
    wiz_step_1: '1. Choose Service',
    wiz_step_2: '2. Trees & Address',
    wiz_step_3: '3. Choose Date',
    wiz_step_4: '4. Confirm & Book',
    wiz_step_1_title: 'Choose Service',
    wiz_step_1_sub: 'Which tree service do you need? (Tap one below)',
    wiz_add_service: 'Add Service',
    wiz_services_selected: 'Selected Services',
    wiz_next_step: 'Continue',
    wiz_step_2_title: 'Trees & Address',
    wiz_step_2_sub: 'Enter how many trees you have and your address in Goa.',
    wiz_tree_count: 'Number of Trees',
    wiz_address: 'Your Address',
    wiz_next_schedule: 'Next: Choose Date',
    wiz_step_3_title: 'Choose Date',
    wiz_step_3_sub: 'Pick a convenient day for our climber to visit your property in',
    wiz_next_confirm: 'Confirm & Pay',
    wiz_confirm_and_pay: 'Confirm & Pay',
    wiz_step_4_title: 'Confirm & Pay',
    wiz_step_4_sub: 'Review your booking details and confirm your payment.',
    wiz_total_price: 'Total Price',
    wiz_book_now: 'Confirm & Pay',
    badge_big_tree: 'Big Tree / Chainsaw Work',
    wiz_customize_date: 'Customize Date',
    wiz_select_slot: 'Select Available Slot'
  },

  hi: {
    // Brand
    brand_name: 'कोकोनट प्लकर (Coconut Plucker)',
    brand_tagline: 'कुशल पेड़ चढ़ाई कार्य, आपकी मांग पर',
    brand_sub: 'गोवा भर में कुशल व प्रमाणित नारियल व पेड़ कटाई सेवा',

    // Auth
    tab_login: 'लॉग इन (Log In)',
    tab_signup: 'साइन अप (Sign Up)',
    auth_otp_login_desc: 'त्वरित ओटीपी लॉगिन के लिए अपना पंजीकृत मोबाइल नंबर दर्ज करें।',
    auth_mobile_label: 'फ़ोन नंबर',
    auth_mobile_placeholder: 'उदा. 984253XXX4',
    auth_mobile_hint: 'आपके मोबाइल पर 4 अंकों का सत्यापन कोड भेजा जाएगा',
    auth_btn_send_otp: 'लॉगिन ओटीपी भेजें',
    auth_btn_sending_otp: 'ओटीपी भेजा जा रहा है...',
    auth_switch_to_admin: 'एडमिनिस्ट्रेटर एवं सुपर एडमिन पासवर्ड लॉगिन',
    auth_switch_to_mobile: 'ग्राहक और प्लकर मोबाइल ओटीपी लॉगिन पर वापस जाएं',
    auth_otp_step_title: 'वन-टाइम पासवर्ड (OTP)',
    auth_otp_sent_to: 'सत्यापन कोड भेजा गया:',
    auth_otp_hint: '',
    auth_btn_verify: 'ओटीपी सत्यापित करें और लॉग इन करें',
    auth_btn_back: 'पीछे जाएं',
    auth_admin_title: 'व्यवस्थापक पोर्टल साइन इन',
    auth_admin_desc: 'अधिकृत कर्मचारी क्रेडेंशियल लॉगिन (प्लेटफ़ॉर्म एडमिन / सुपर एडमिन)।',
    auth_admin_user_label: 'एडमिन मोबाइल नंबर या यूज़रनेम',
    auth_admin_user_placeholder: 'उदा. 984253XXX4, admin, या superadmin',
    auth_admin_pass_label: 'पासवर्ड',
    auth_admin_pass_placeholder: 'पासवर्ड दर्ज करें (उदा. admin123)',
    auth_btn_admin_login: 'एडमिनिस्ट्रेटर के रूप में लॉग इन करें',

    // Sign Up
    signup_full_name: 'पूरा नाम',
    signup_full_name_placeholder: 'उदा. रोहिदास नायक',
    signup_phone: 'फ़ोन नंबर',
    signup_phone_placeholder: 'उदा. 984253XXX4',
    signup_i_am: 'मैं पंजीकरण कर रहा हूँ:',
    signup_role_customer: 'ग्राहक (पेड़ मालिक / संपत्ति)',
    signup_role_climber: 'पेशेवर प्लकर (पेड़ चढ़ने वाला)',
    signup_taluka: 'तालुका / जिला',
    signup_address: 'पता (लैंडमार्क सहित)',
    signup_address_placeholder: 'घर नं., गाँव/शहर, लैंडमार्क, गोवा',
    signup_exp: 'अनुभव (वर्ष)',
    signup_safety: 'सुरक्षा / प्रमाणन विवरण',
    signup_safety_placeholder: 'उदा. सीपीसीआरआई क्लाइंबर / 5+ वर्ष अनुभव',
    signup_btn_continue: 'आगे बढ़ें और फ़ोन सत्यापित करें',
    signup_btn_complete: 'सत्यापित करें और खाता बनाएं',

    // Nav & Common Topbar
    nav_book_service: 'सेवा बुक करें',
    nav_my_bookings: 'मेरी बुकिंग',
    nav_profile: 'प्रोफ़ाइल',
    nav_dashboard: 'डैशबोर्ड',
    nav_assigned_jobs: 'आवंटित कार्य',
    nav_skills_safety: 'कौशल और सुरक्षा प्रोफ़ाइल',
    nav_admin_overview: 'संचालन अवलोकन',
    nav_scheduling: 'क्षेत्रीय शेड्यूलिंग',
    nav_analytics: 'विश्लेषण और रिपोर्ट',
    nav_all_bookings: 'सभी बुकिंग',
    nav_workforce: 'पेशेवर कार्यबल',
    nav_catalog: 'सेवा कैटलॉग',
    nav_safety_incidents: 'सुरक्षा और घटनाएं',
    nav_admin_management: 'व्यवस्थापक प्रबंधन',
    nav_audit_trail: 'ऑडिट ट्रेल',
    nav_super_profile: 'सुरक्षा और क्रेडेंशियल',
    sign_out: 'साइन आउट',
    verified: 'सत्यापित',
    admin_badge: 'व्यवस्थापक',
    super_admin_badge: 'सुपर एडमिन',

    // Topbar titles
    top_book_service_title: 'सेवा बुक करें',
    top_book_service_sub: 'गोवा में अपने पेड़ों के लिए विश्वसनीय स्थानीय क्लाइंबर बुक करें।',
    top_my_bookings_title: 'मेरी बुकिंग',
    top_my_bookings_sub: 'सक्रिय बुकिंग ट्रैक करें, भुगतान करें और समीक्षा दें',
    top_cust_profile_title: 'ग्राहक प्रोफ़ाइल',
    top_cust_profile_sub: 'अपनी संपर्क जानकारी और डिफ़ॉल्ट तालुका प्रबंधित करें',
    top_pro_dash_title: 'पेशेवर डैशबोर्ड',
    top_pro_dash_sub: 'आवंटित बुकिंग, सुरक्षा चेकलिस्ट और कार्य प्रबंधन',
    top_pro_jobs_title: 'आवंटित बुकिंग',
    top_pro_jobs_sub: 'सुरक्षा चेकलिस्ट पूरी करें, कार्य शुरू करें और समाप्त करें',
    top_pro_profile_title: 'कौशल और सुरक्षा प्रोफ़ाइल',
    top_pro_profile_sub: 'अनुभव, सुरक्षा प्रमाणन और क्षमताओं का प्रबंधन',
    top_adm_overview_title: 'एडमिन संचालन अवलोकन',
    top_adm_overview_sub: 'बुकिंग, कार्यबल सत्यापन और सेवा मेट्रिक्स का लाइव दृश्य',
    top_adm_scheduling_title: 'क्षेत्रीय शेड्यूलिंग शासन',
    top_adm_scheduling_sub: 'तालुका कार्य दिवस और दैनिक क्षमता सीमा प्रबंधित करें',
    top_adm_admins_title: 'व्यवस्थापक खाता प्रबंधन',
    top_adm_admins_sub: 'प्लेटफ़ॉर्म व्यवस्थापक खाते बनाएं, कॉन्फ़िगर और प्रबंधित करें',
    top_adm_audit_title: 'प्लेटफ़ॉर्म ऑडिट ट्रेल',
    top_adm_audit_sub: 'सभी व्यवस्थापक संचालन और अनुपालन घटनाओं का लॉग',
    top_adm_safety_title: 'सुरक्षा और घटना रिपोर्ट',
    top_adm_safety_sub: 'सुरक्षा ऑडिट, उपकरण जांच और घटना लॉग ट्रैक करें',
    top_adm_reports_title: 'विश्लेषण और राजस्व रिपोर्ट',
    top_adm_reports_sub: 'मात्रा विवरण, राजस्व प्राप्ति और सेवा मांग',
    top_adm_profile_title: 'व्यवस्थापक प्रोफ़ाइल',
    top_adm_profile_sub: 'व्यवस्थापक प्रोफ़ाइल विवरण, क्षेत्रीय दायरा और सुरक्षा प्रबंधित करें',

    // Common UI
    btn_next: 'अगला कदम',
    btn_back: 'पीछे',
    btn_edit: 'संपादित करें',
    btn_delete: 'हटाएं',
    btn_cancel: 'रद्द करें',
    btn_confirm: 'पुष्टि करें',
    btn_save: 'बदलाव सहेजें',
    btn_submit: 'जमा करें',
    select_language: 'भाषा (Language)',
    status_active: 'सक्रिय',
    status_pending: 'लंबित',
    status_completed: 'पूर्ण',
    status_assigned: 'आवंटित',
    status_in_progress: 'प्रगति पर',
    status_cancelled: 'रद्द',
    emergency_badge: 'आपातकालीन बुकिंग (24 घंटे)',
    tree_count: 'पेड़ों की संख्या',
    total_amount: 'कुल राशि',
    pay_now: 'अभी भुगतान करें',
    rupees: '₹',

    // Role & Taluka translation keys
    role_customer: 'ग्राहक',
    role_professional: 'पेशेवर क्लाइंबर',
    role_admin: 'व्यवस्थापक',
    role_super_admin: 'सुपर एडमिन',
    taluka_north_goa: 'उत्तर गोवा',
    taluka_south_goa: 'दक्षिण गोवा',
    taluka_kushavati: 'कुशावती',
    taluka_all: 'सभी तालुका',

    // Wizard Step Translation Keys
    wiz_step_1: '1. सेवा चुनें',
    wiz_step_2: '2. पेड़ और पता',
    wiz_step_3: '3. तिथि चुनें',
    wiz_step_4: '4. पुष्टि करें और बुक करें',
    wiz_step_1_title: 'सेवा चुनें',
    wiz_step_1_sub: 'आपको कौन सी पेड़ सेवा चाहिए? (नीचे एक चुनें)',
    wiz_add_service: 'सेवा जोड़ें',
    wiz_services_selected: 'चयनित सेवाएं',
    wiz_next_step: 'अगला कदम',
    wiz_step_2_title: 'पेड़ और पता',
    wiz_step_2_sub: 'अपने पेड़ों की संख्या और गोवा का पता दर्ज करें।',
    wiz_tree_count: 'पेड़ों की संख्या',
    wiz_address: 'आपका पता',
    wiz_next_schedule: 'आगे: तिथि चुनें',
    wiz_step_3_title: 'तिथि चुनें',
    wiz_step_3_sub: 'क्लाइंबर के दौरे के लिए सुविधाजनक दिन चुनें:',
    wiz_next_confirm: 'पुष्टि करें और भुगतान करें',
    wiz_confirm_and_pay: 'पुष्टि करें और भुगतान करें',
    wiz_step_4_title: 'पुष्टि करें और भुगतान करें',
    wiz_step_4_sub: 'अपने बुकिंग विवरण और कुल मूल्य की समीक्षा करें।',
    wiz_total_price: 'कुल मूल्य',
    wiz_book_now: 'पुष्टि करें और भुगतान करें',
    badge_big_tree: 'बड़ा पेड़ / चेनसॉ कार्य',
    wiz_customize_date: 'तिथि अनुकूलित करें',
    wiz_select_slot: 'उपलब्ध स्लॉट चुनें'
  },

  mr: {
    // Brand
    brand_name: 'कोकोनट प्लकर (Coconut Plucker)',
    brand_tagline: 'कुशल झाडावर चढण्याचे काम, मागणीनुसार',
    brand_sub: 'गोवाभर कुशल व प्रमाणित नारळ व झाड काढणी सेवा',

    // Auth
    tab_login: 'लॉग इन (Log In)',
    tab_signup: 'साइन अप (Sign Up)',
    auth_otp_login_desc: 'त्वरित ओटीपी लॉगिनसाठी आपला नोंदणीकृत मोबाइल नंबर प्रविष्ट करा.',
    auth_mobile_label: 'फोन नंबर',
    auth_mobile_placeholder: 'उदा. 984253XXX4',
    auth_mobile_hint: 'आपल्या मोबाइलवर ४ अंकी पडताळणी कोड पाठवला जाईल',
    auth_btn_send_otp: 'लॉगिन ओटीपी पाठवा',
    auth_btn_sending_otp: 'ओटीपी पाठवत आहे...',
    auth_switch_to_admin: 'अ‍ॅडमिनिस्ट्रेटर आणि सुपर अ‍ॅडमिन पासवर्ड लॉगिन',
    auth_switch_to_mobile: 'ग्राहक आणि क्लाइंबर मोबाइल ओटीपी लॉगिनकडे परत जा',
    auth_otp_step_title: 'वन-टाइम पासवर्ड (OTP)',
    auth_otp_sent_to: 'पडताळणी कोड पाठवला गेला:',
    auth_otp_hint: '',
    auth_btn_verify: 'ओटीपी पडताळा आणि लॉग इन करा',
    auth_btn_back: 'मागे जा',
    auth_admin_title: 'व्यवस्थापक पोर्टल साइन इन',
    auth_admin_desc: 'अधिकृत कर्मचारी क्रेडेंशियल्स लॉगिन (प्लॅटफॉर्म अ‍ॅडमिन / सुपर अ‍ॅडमिन).',
    auth_admin_user_label: 'अ‍ॅडमिन मोबाइल नंबर किंवा युझरनेम',
    auth_admin_user_placeholder: 'उदा. 984253XXX4, admin, किंवा superadmin',
    auth_admin_pass_label: 'पासवर्ड',
    auth_admin_pass_placeholder: 'पासवर्ड प्रविष्ट करा (उदा. admin123)',
    auth_btn_admin_login: 'व्यवस्थापक म्हणून लॉग इन करा',

    // Sign Up
    signup_full_name: 'पूर्ण नाव',
    signup_full_name_placeholder: 'उदा. रोहिदास नाईक',
    signup_phone: 'फोन नंबर',
    signup_phone_placeholder: 'उदा. 984253XXX4',
    signup_i_am: 'मी नोंदणी करत आहे:',
    signup_role_customer: 'ग्राहक (झाडाचा मालक / जागा)',
    signup_role_climber: 'व्यावसायिक क्लाइंबर (झाडावर चढणारे)',
    signup_taluka: 'तालुका / जिल्हा',
    signup_address: 'पत्ता (लँडमार्कसह)',
    signup_address_placeholder: 'घर क्र., गाव/शहर, लँडमार्क, गोवा',
    signup_exp: 'अनुभव (वर्षे)',
    signup_safety: 'सुरक्षा / प्रमाणपत्र तपशील',
    signup_safety_placeholder: 'उदा. सीपीसीआरआय क्लाइंबर / ५+ वर्षे अनुभव',
    signup_btn_continue: 'पुढे जा आणि फोन पडताळा',
    signup_btn_complete: 'पडताळा आणि खाते तयार करा',

    // Nav & Common Topbar
    nav_book_service: 'सेवा बुक करा',
    nav_my_bookings: 'माझ्या बुकिंग्स',
    nav_profile: 'प्रोफाइल',
    nav_dashboard: 'डॅशबोर्ड',
    nav_assigned_jobs: 'वाटप केलेली कामे',
    nav_skills_safety: 'कौशल्य आणि सुरक्षा प्रोफाइल',
    nav_admin_overview: 'ऑपरेशन्स विहंगावलोकन',
    nav_scheduling: 'प्रादेशिक वेळापत्रक',
    nav_analytics: 'विश्लेषण आणि अहवाल',
    nav_all_bookings: 'सर्व बुकिंग्स',
    nav_workforce: 'व्यावसायिक कार्यबल',
    nav_catalog: 'सेवा कॅटलॉग',
    nav_safety_incidents: 'सुरक्षा आणि दुर्घटना',
    nav_admin_management: 'व्यवस्थापक व्यवस्थापन',
    nav_audit_trail: 'प्लॅटफॉर्म ऑडिट ट्रेल',
    nav_super_profile: 'सुरक्षा आणि क्रेडेंशियल्स',
    sign_out: 'साइन आउट',
    verified: 'प्रमाणित',
    admin_badge: 'व्यवस्थापक',
    super_admin_badge: 'सुपर अ‍ॅडमिन',

    // Topbar titles
    top_book_service_title: 'सेवा बुक करा',
    top_book_service_sub: 'गोव्यात आपल्या झाडांसाठी विश्वासू स्थानिक क्लाइंबर बुक करा.',
    top_my_bookings_title: 'माझ्या बुकिंग्स',
    top_my_bookings_sub: 'सक्रिय बुकिंगचा मागोवा घ्या, पैसे द्या आणि अभिप्राय नोंदवा',
    top_cust_profile_title: 'ग्राहक प्रोफाइल',
    top_cust_profile_sub: 'आपले संपर्क तपशील आणि डीफॉल्ट तालुका व्यवस्थापित करा',
    top_pro_dash_title: 'व्यावसायिक डॅशबोर्ड',
    top_pro_dash_sub: 'वाटप केलेल्या बुकिंग्स, सुरक्षा चेकलिस्ट आणि काम व्यवस्थापन',
    top_pro_jobs_title: 'वाटप केलेल्या बुकिंग्स',
    top_pro_jobs_sub: 'सुरक्षा चेकलिस्ट पूर्ण करा, काम सुरू करा आणि पूर्ण करा',
    top_pro_profile_title: 'कौशल्य आणि सुरक्षा प्रोफाइल',
    top_pro_profile_sub: 'अनुभव, सुरक्षा प्रमाणपत्र आणि सेवा क्षमता व्यवस्थापित करा',
    top_adm_overview_title: 'अ‍ॅडमिन ऑपरेशन्स विहंगावलोकन',
    top_adm_overview_sub: 'बुकिंग्स, कार्यबल पडताळणी आणि सेवा मेट्रिक्सचे थेट दृश्य',
    top_adm_scheduling_title: 'प्रादेशिक वेळापत्रक प्रशासन',
    top_adm_scheduling_sub: 'तालुका कामाचे दिवस आणि दैनंदिन क्षमता मर्यादा व्यवस्थापित करा',
    top_adm_admins_title: 'व्यवस्थापक खाते व्यवस्थापन',
    top_adm_admins_sub: 'प्लॅटफॉर्म व्यवस्थापक खाती तयार करा, कॉन्फिगर आणि व्यवस्थापित करा',
    top_adm_audit_title: 'प्लॅटफॉर्म ऑडिट ट्रेल',
    top_adm_audit_sub: 'सर्व व्यवस्थापक ऑपरेशन्स आणि नियमन नोंदींचा शोध',
    top_adm_safety_title: 'सुरक्षा आणि दुर्घटना अहवाल',
    top_adm_safety_sub: 'सुरक्षा तपासणी, उपकरण ऑडिट आणि घटना नोंदी',
    top_adm_reports_title: 'विश्लेषण आणि महसूल अहवाल',
    top_adm_reports_sub: 'कामांचे प्रमाण, महसूल प्राप्ती आणि सेवा मागणी',
    top_adm_profile_title: 'प्रशासक प्रोफाइल',
    top_adm_profile_sub: 'प्रशासक प्रोफाइल तपशील, प्रादेशिक व्याप्ती आणि क्रेडेंशियल्स व्यवस्थापित करा',

    // Common UI
    btn_next: 'पुढील पायरी',
    btn_back: 'मागे',
    btn_edit: 'संपादित करा',
    btn_delete: 'हटवा',
    btn_cancel: 'रद्द करा',
    btn_confirm: 'खात्री करा',
    btn_save: 'बदल जतन करा',
    btn_submit: 'सादर करा',
    select_language: 'भाषा (Language)',
    status_active: 'सक्रिय',
    status_pending: 'प्रलंबित',
    status_completed: 'पूर्ण',
    status_assigned: 'वाटप झाले',
    status_in_progress: 'प्रगति पर',
    status_cancelled: 'रद्द',
    emergency_badge: 'आपातकालीन बुकिंग (24 तास)',
    tree_count: 'झाडांची संख्या',
    total_amount: 'एकूण रक्कम',
    pay_now: 'आत्ताच पैसे द्या',
    rupees: '₹',

    // Role & Taluka translation keys
    role_customer: 'ग्राहक',
    role_professional: 'व्यावसायिक क्लाइंबर',
    role_admin: 'व्यवस्थापक',
    role_super_admin: 'सुपर अ‍ॅडमिन',
    taluka_north_goa: 'उत्तर गोवा',
    taluka_south_goa: 'दक्षिण गोवा',
    taluka_kushavati: 'कुशावती',
    taluka_all: 'सर्व तालुके',

    // Wizard Step Translation Keys
    wiz_step_1: '१. सेवा निवडा',
    wiz_step_2: '२. झाडे आणि पत्ता',
    wiz_step_3: '३. तारीख निवडा',
    wiz_step_4: '४. खात्री करा आणि बुक करा',
    wiz_step_1_title: 'सेवा निवडा',
    wiz_step_1_sub: 'आपल्याला कोणती झाड सेवा हवी आहे? (खाली एक निवडा)',
    wiz_add_service: 'सेवा जोडा',
    wiz_services_selected: 'निवडलेल्या सेवा',
    wiz_next_step: 'पुढील पायरी',
    wiz_step_2_title: 'झाडे आणि पत्ता',
    wiz_step_2_sub: 'आपल्या झाडांची संख्या आणि गोव्यातील पत्ता प्रविष्ट करा.',
    wiz_tree_count: 'झाडांची संख्या',
    wiz_address: 'आपला पत्ता',
    wiz_next_schedule: 'पुढे: तारीख निवडा',
    wiz_step_3_title: 'तारीख निवडा',
    wiz_step_3_sub: 'क्लाइंबरच्या भेटीसाठी सोयीस्कर दिवस निवडा:',
    wiz_next_confirm: 'पुष्टी करा आणि पैसे द्या',
    wiz_confirm_and_pay: 'पुष्टी करा आणि पैसे द्या',
    wiz_step_4_title: 'पुष्टी करा आणि पैसे द्या',
    wiz_step_4_sub: 'आपल्या बुकिंग तपशील आणि एकूण मूल्याचे पुनरावलोकन करा.',
    wiz_total_price: 'एकूण किंमत',
    wiz_book_now: 'पुष्टी करा आणि पैसे द्या',
    badge_big_tree: 'मोठे झाड / चेनसॉ काम',
    wiz_customize_date: 'तारीख सानुकूल करा',
    wiz_select_slot: 'उपलब्ध स्लॉट निवडा'
  }
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguageState] = useState(() => {
    try {
      const saved = localStorage.getItem('cp_language');
      if (saved && (saved === 'en' || saved === 'hi' || saved === 'mr')) {
        return saved;
      }
    } catch {
      // ignore
    }
    return 'en'; // default English
  });

  const setLanguage = (lang) => {
    if (lang === 'en' || lang === 'hi' || lang === 'mr') {
      setLanguageState(lang);
      try {
        localStorage.setItem('cp_language', lang);
      } catch {
        // ignore
      }
    }
  };

  const t = (key, fallback = '') => {
    const dict = TRANSLATIONS[language] || TRANSLATIONS.en;
    if (dict[key] !== undefined) {
      return dict[key];
    }
    const defaultDict = TRANSLATIONS.en;
    if (defaultDict[key] !== undefined) {
      return defaultDict[key];
    }
    return fallback || key;
  };

  const currentLangMeta = LANGUAGES.find((l) => l.code === language) || LANGUAGES[0];

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, languages: LANGUAGES, currentLangMeta }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
