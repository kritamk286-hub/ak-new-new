/**
 * Comprehensive Hindi Translation & Auto-Conversion Engine
 * Handles full UI strings, arbitrary person names, addresses, products,
 * units, status messages, and number-to-words in Hindi (Devanagari).
 */

// 1. Multi-word phrases dictionary (Exact and normalized match)
export const PHRASE_DICTIONARY: Record<string, string> = {
  // Brand & General
  'ak enterprises': 'एके एंटरप्राइजेज',
  'ak enterprise': 'एके एंटरप्राइज',
  'billing counter': 'बिलिंग काउंटर',
  'pos billing terminal': 'पीओएस बिलिंग टर्मिनल',
  'point of sale': 'बिक्री केंद्र (पीओएस)',
  'live counter': 'चालू काउंटर',
  'official tax invoice': 'अधिकृत कर चालान (टैक्स इनवॉइस)',
  'tax invoice': 'कर चालान (टैक्स इनवॉइस)',
  'cash memo': 'रोकड़ पर्ची (कैश मेमो)',
  'tax invoice / cash memo': 'कर चालान / रोकड़ पर्ची',
  'retail invoice': 'खुदरा बिल (रिटेल इनवॉइस)',

  // Customer & Destination
  'walk-in customer': 'दुकान पर आया ग्राहक',
  'walk-in': 'दुकान ग्राहक',
  'counter pickup': 'काउंटर पिकअप',
  'shop counter pickup': 'दुकान काउंटर से लिया',
  'shop counter': 'दुकान काउंटर',
  'delivery location': 'डिलीवरी / डिलीवरी का स्थान',
  'customer details': 'ग्राहक का विवरण',
  'customer name': 'ग्राहक का नाम',
  'mobile number': 'मोबाइल नंबर',
  'phone number': 'फोन नंबर',
  'billed to': 'बिल प्राप्तकर्ता (ग्राहक)',
  'authorized counter': 'अधिकृत काउंटर',
  'authorized signatory': 'अधिकृत हस्ताक्षरकर्ता',
  'terms & conditions': 'नियम व शर्तें',
  'terms and conditions': 'नियम व शर्तें',

  // Stock & Inventory
  'current stock': 'वर्तमान स्टॉक',
  'available stock': 'उपलब्ध स्टॉक',
  'in stock': 'स्टॉक में उपलब्ध',
  'low stock': 'कम स्टॉक अलर्ट',
  'out of stock': 'स्टॉक समाप्त (Out of Stock)',
  'stock added': 'स्टॉक जमा किया',
  'stock reduced': 'स्टॉक निकाला',
  'stock adjusted': 'स्टॉक सुधारा',
  'sale created': 'बिक्री दर्ज हुई',
  'stock movement': 'स्टॉक आवाजाही',
  'minimum stock': 'न्यूनतम स्टॉक सीमा',
  'selling price': 'बिक्री दर (मूल्य)',
  'cost price': 'खरीद दर (लागत)',
  'purchase price': 'खरीद दर',
  'rate / price': 'दर / मूल्य (₹)',
  'total amount': 'कुल राशि (₹)',
  'total payable': 'कुल भुगतान योग्य',
  'grand total': 'महायोग (कुल राशि)',
  'total items': 'कुल सामान (आइटम)',
  'total units': 'कुल मात्रा (यूनिट)',
  'item description': 'सामान का विवरण',
  'item summary': 'सामान का सारांश',
  'remaining stock': 'शेष बचा स्टॉक',
  'remaining in inventory': 'गोदाम में शेष स्टॉक',
  'supplier name': 'आपूर्तिकर्ता (सप्लायर)',
  'supplier details': 'आपूर्तिकर्ता विवरण',

  // Actions
  'complete & print bill': 'बिल बनाएं और प्रिंट करें',
  'complete sale': 'बिक्री पूर्ण करें',
  'print bill': 'बिल प्रिंट करें',
  'print receipt': 'रसीद प्रिंट करें',
  'next bill': 'अगला बिल',
  'next sale': 'अगली बिक्री',
  'clear form': 'फॉर्म साफ करें',
  'reset default': 'सामान्य दर करें',
  'quick walk-in': 'त्वरित ग्राहक',
  'select product': 'सामान चुनें',
  'all categories': 'सभी श्रेणियां',
  'all items': 'सभी सामान',
  'all payments': 'सभी भुगतान प्रकार',
  'all time': 'सभी समय',
  'today': 'आज',
  'yesterday': 'कल (बीता हुआ)',
  'last 7 days': 'पिछले 7 दिन',
  'this month': 'इस महीने',
  'custom range': 'अपनी पसंद की तारीखें',
  'add stock': 'स्टॉक जोड़ें (माल आया)',
  'add product': 'नया सामान जोड़ें',
  'edit product': 'सामान संपादित करें',
  'delete product': 'सामान हटाएं',
  'view details': 'पूरी जानकारी देखें',
  'sales history': 'बिक्री इतिहास',
  'inventory ledger': 'स्टॉक बहीखाता',
  'dashboard': 'डैशबोर्ड / मुखपृष्ठ',
  'analytics': 'बिक्री विश्लेषण',
  'settings': 'सेटिंग्स',
  'logout': 'लॉग आउट',
  'login': 'लॉग इन',
  'sign in': 'साइन इन करें',

  // Payment methods
  'cash': 'नकद (Cash)',
  'upi': 'यूपीआई / ऑनलाइन (UPI)',
  'upi / qr': 'यूपीआई / क्यूआर कोड',
  'card': 'कार्ड (Card / POS)',
  'credit': 'उधार खाता (Credit / Khata)',
  'paid & settled': 'पूर्ण भुगतान प्राप्त (Paid)',
  'pending': 'बकाया (Pending)',
  'completed': 'सफल (Completed)',
  'cancelled': 'रद्द (Cancelled)',

  // Units
  'pieces': 'पीस (नग)',
  'piece': 'पीस (नग)',
  'pcs': 'पीस',
  'bags': 'बोरी / बैग',
  'bag': 'बोरी / बैग',
  'kg': 'किलोग्राम (किग्रा)',
  'kilogram': 'किलोग्राम',
  'grams': 'ग्राम',
  'litres': 'लीटर',
  'litre': 'लीटर',
  'ltr': 'लीटर',
  'meters': 'मीटर',
  'meter': 'मीटर',
  'metres': 'मीटर',
  'feet': 'फीट',
  'ft': 'फीट',
  'boxes': 'डिब्बा / बॉक्स',
  'box': 'डिब्बा',
  'bundles': 'बंडल',
  'bundle': 'बंडल',
  'packets': 'पैकेट',
  'packet': 'पैकेट',
  'rolls': 'रोल',
  'roll': 'रोल',
  'units': 'इकाई (Units)',
  'unit': 'इकाई',

  // Address & Place terms
  'main road': 'मुख्य मार्ग',
  'market complex': 'बाज़ार परिसर',
  'commercial complex': 'व्यापारिक परिसर',
  'near bus stand': 'बस स्टैंड के पास',
  'near railway station': 'रेलवे स्टेशन के पास',
  'near hospital': 'अस्पताल के पास',
  'near temple': 'मंदिर के पास',
  'near chowk': 'चौक के पास',
  'industrial area': 'औद्योगिक क्षेत्र',
  'civil lines': 'सिविल लाइन्स',
};

// 2. Common Indian Names & Surnames Dictionary
export const NAMES_DICTIONARY: Record<string, string> = {
  // First names
  'ramesh': 'रमेश',
  'suresh': 'सुरेश',
  'mahesh': 'महेश',
  'rajesh': 'राजेश',
  'dinesh': 'दिनेश',
  'mukesh': 'मुकेश',
  'rakesh': 'राकेश',
  'amit': 'अमित',
  'rahul': 'राहुल',
  'rohit': 'रोहित',
  'vikas': 'विकास',
  'vijay': 'विजय',
  'ajay': 'अजय',
  'sanjay': 'संजय',
  'manoj': 'मनोज',
  'vinod': 'विनोद',
  'pramod': 'प्रमोद',
  'alok': 'आलोक',
  'ashok': 'अशोक',
  'anil': 'अनिल',
  'sunil': 'सुनील',
  'deepak': 'दीपक',
  'pankaj': 'पंकज',
  'neeraj': 'नीरज',
  'satish': 'सतीश',
  'manish': 'मनीष',
  'sachin': 'सचिन',
  'nitin': 'नितिन',
  'vivek': 'विवेक',
  'anand': 'आनंद',
  'mohan': 'मोहन',
  'sohan': 'सोहन',
  'rohan': 'रोहन',
  'gopal': 'गोपाल',
  'krishna': 'कृष्णा',
  'radhe': 'राधे',
  'shyam': 'श्याम',
  'hari': 'हरि',
  'om': 'ओम',
  'prakash': 'प्रकाश',
  'santosh': 'संतोष',
  'arun': 'अरुण',
  'varun': 'वरुण',
  'tarun': 'तरुण',
  'karan': 'करण',
  'arjun': 'अर्जुन',
  'ravi': 'रवि',
  'kavi': 'कवि',
  'suraj': 'सूरज',
  'chandan': 'चंदन',
  'pawan': 'पवन',
  'dharmendra': 'धर्मेन्द्र',
  'jitendra': 'जितेन्द्र',
  'surendra': 'सुरेन्द्र',
  'devendra': 'देवेन्द्र',
  'satendra': 'सतेन्द्र',
  'satyendra': 'सत्येन्द्र',
  'birendra': 'बीरेन्द्र',
  'upendra': 'उपेन्द्र',
  'rajendra': 'राजेन्द्र',
  'shailendra': 'शैलेन्द्र',
  'kamlesh': 'कमलेश',
  'mithilesh': 'मिथिलेश',
  'akhilesh': 'अखिलेश',
  'sarvesh': 'सर्वेश',
  'brajesh': 'बृजेश',
  'harish': 'हरीश',
  'jagdish': 'जगदीश',
  'subhash': 'सुभाष',
  'avadh': 'अवध',
  'pradeep': 'प्रदीप',
  'kuldeep': 'कुलदीप',
  'sandeep': 'संदीप',
  'amardeep': 'अमरदीप',
  'hardeep': 'हरदीप',
  'gurdeep': 'गुरदीप',
  'balram': 'बलराम',
  'sitaram': 'सीताराम',
  'radheshyam': 'राधेश्याम',
  'ramchandra': 'रामचन्द्र',
  'rameshwar': 'रामेश्वर',
  'bholanath': 'भोलानाथ',
  'shambhu': 'शंभू',
  'ganesh': 'गणेश',
  'kartik': 'कार्तिक',
  'shivam': 'शिवम',
  'satyam': 'सत्यम',
  'shubham': 'शुभम',
  'abhishek': 'अभिषेक',
  'anurag': 'अनुराग',
  'ashutosh': 'आशुतोष',
  'anupam': 'अनुपम',
  'aditya': 'आदित्य',
  'ayush': 'आयुष',
  'aniket': 'अनिकेत',
  'ankit': 'अंकित',
  'aman': 'अमन',
  'arvind': 'अरविंद',
  'govind': 'गोविंद',
  'mukund': 'मुकुंद',
  'bhupendra': 'भूपेन्द्र',
  'naresh': 'नरेश',
  'ram': 'राम',
  'lal': 'लाल',
  'chand': 'चंद',
  'prasad': 'प्रसाद',

  // Surnames
  'kumar': 'कुमार',
  'singh': 'सिंह',
  'sharma': 'शर्मा',
  'verma': 'वर्मा',
  'gupta': 'गुप्ता',
  'yadav': 'यादव',
  'patel': 'पटेल',
  'shah': 'शाह',
  'jain': 'जैन',
  'agarwal': 'अग्रवाल',
  'agrawal': 'अग्रवाल',
  'tiwari': 'तिवारी',
  'pandey': 'पांडेय',
  'mishra': 'मिश्रा',
  'dubey': 'दुबे',
  'shukla': 'शुक्ला',
  'pathak': 'पाठक',
  'chaudhary': 'चौधरी',
  'choudhary': 'चौधरी',
  'jha': 'झा',
  'thakur': 'ठाकुर',
  'chauhan': 'चौहान',
  'rajput': 'राजपूत',
  'paswan': 'पासवान',
  'manjhi': 'मांझी',
  'sah': 'साह',
  'sahu': 'साहू',
  'keshri': 'केशरी',
  'keshari': 'केशरी',
  'burnwal': 'वर्णवाल',
  'barnwal': 'वर्णवाल',
  'chaurasia': 'चौरसिया',
  'maurya': 'मौर्या',
  'kushwaha': 'कुशवाहा',
  'mehta': 'मेहता',
  'joshi': 'जोशी',
  'bhatt': 'भट्ट',
  'tripathi': 'त्रिपाठी',
  'dwivedi': 'द्विवेदी',
  'upadhyay': 'उपाध्याय',
  'pandit': 'पंडित',
  'das': 'दास',
  'roy': 'रॉय',
  'sen': 'सेन',
  'ghosh': 'घोष',
  'bose': 'बोस',
  'dutta': 'दत्ता',
  'banerjee': 'बनर्जी',
  'chatterjee': 'चैटर्जी',
  'mukherjee': 'मुखर्जी',
  'khan': 'खान',
  'ansari': 'अंसारी',
  'ali': 'अली',
  'ahmed': 'अहमद',
  'hussain': 'हुसैन',
  'sheikh': 'शेख',
  'siddiqui': 'सिद्दीकी',
  'qureshi': 'कुरैशी',
  'khatoon': 'खातून',
  'begum': 'बेगम',
  'devi': 'देवी',
};

// 3. Address & Geographical Words Dictionary
export const ADDRESS_WORDS: Record<string, string> = {
  'road': 'रोड',
  'rd': 'रोड',
  'marg': 'मार्ग',
  'path': 'पथ',
  'gali': 'गली',
  'lane': 'गली / लेन',
  'street': 'स्ट्रीट (सड़क)',
  'chowk': 'चौक',
  'chauraha': 'चौराहा',
  'mor': 'मोड़',
  'bazaar': 'बाज़ार',
  'market': 'मार्केट (बाज़ार)',
  'mandi': 'मंडी',
  'nagar': 'नगर',
  'colony': 'कॉलोनी',
  'enclave': 'एन्क्लेव',
  'vihar': 'विहार',
  'pur': 'पुर',
  'puri': 'पुरी',
  'ganj': 'गंज',
  'ward': 'वार्ड',
  'sector': 'सेक्टर',
  'block': 'ब्लॉक',
  'plot': 'प्लॉट',
  'house': 'मकान',
  'shop': 'दुकान',
  'flat': 'फ्लैट',
  'building': 'भवन / बिल्डिंग',
  'complex': 'कॉम्प्लेक्स',
  'floor': 'मंज़िल',
  'ground': 'ग्राउंड',
  'basement': 'बेसमेंट',
  'first': 'प्रथम',
  'second': 'द्वितीय',
  'third': 'तृतीय',
  'village': 'गांव (ग्राम)',
  'gram': 'ग्राम',
  'post': 'पोस्ट',
  'po': 'पोस्ट',
  'police': 'थाना',
  'station': 'स्टेशन',
  'dist': 'जिला',
  'district': 'जिला',
  'state': 'राज्य',
  'pin': 'पिन कोड',
  'pincode': 'पिन कोड',
  'near': 'के पास',
  'opp': 'के सामने',
  'opposite': 'के सामने',
  'behind': 'के पीछे',
  'beside': 'के बगल में',
  'front': 'सामने',
  'back': 'पीछे',
  'side': 'तरफ',
  'upper': 'ऊपर',
  'lower': 'नीचे',
  'new': 'न्यू (नया)',
  'old': 'पुराना',
  'bada': 'बड़ा',
  'chota': 'छोटा',
  'delhi': 'दिल्ली',
  'patna': 'पटना',
  'ranchi': 'राँची',
  'kolkata': 'कोलकाता',
  'mumbai': 'मुंबई',
  'lucknow': 'लखनऊ',
  'varanasi': 'वाराणसी',
  'kanpur': 'कानपुर',
  'allahabad': 'इलाहाबाद / प्रयागराज',
  'prayagraj': 'प्रयागराज',
  'gorakhpur': 'गोरखपुर',
  'gaya': 'गया',
  'muzaffarpur': 'मुज़फ़्फ़रपुर',
  'bhagalpur': 'भागलपुर',
  'dhanbad': 'धनबाद',
  'bokaro': 'बोकारो',
  'jamshedpur': 'जमशेदपुर',
  'deoghar': 'देवघर',
  'hazaribagh': 'हज़ारीबाग',
  'giridih': 'गिरिडीह',
};

// 4. Products & Hardware Materials Dictionary
export const PRODUCT_WORDS: Record<string, string> = {
  'cement': 'सीमेंट',
  'iron': 'लोहा',
  'steel': 'स्टील',
  'rod': 'सरिया / रॉड',
  'tmt': 'टीएमटी सरिया',
  'bar': 'सरिया',
  'pipe': 'पाइप',
  'pvc': 'पीवीसी',
  'cpvc': 'सीपीवीसी',
  'upvc': 'यूपीवीसी',
  'fitting': 'फिटिंग',
  'paint': 'पेंट / रंग',
  'primer': 'प्राइमर',
  'distemper': 'डिस्टेंपर',
  'emulsion': 'इमल्शन पेंट',
  'enamel': 'एनेमल पेंट',
  'brush': 'ब्रश',
  'roller': 'रोलर',
  'putty': 'पुट्टी',
  'wall': 'दीवार',
  'wire': 'बिजली का तार',
  'cable': 'केबल',
  'switch': 'स्विच',
  'socket': 'सॉकेट',
  'board': 'बोर्ड',
  'mcb': 'एमसीबी',
  'bulb': 'बल्ब',
  'light': 'लाइट / रोशनी',
  'fan': 'पंखा',
  'nail': 'कील',
  'nails': 'कीलें',
  'screw': 'स्क्रू / पेंच',
  'screws': 'पेंच',
  'nut': 'नट',
  'bolt': 'बोल्ट',
  'washer': 'वॉशर',
  'tape': 'टेप',
  'plywood': 'प्लाईवुड',
  'ply': 'प्लाई',
  'timber': 'लकड़ी',
  'wood': 'लकड़ी',
  'sunmica': 'सनमाइका / लैमिनेट',
  'adhesive': 'गोंद / फेविकोल',
  'fevicol': 'फेविकोल',
  'hinge': 'कब्ज़ा',
  'hinges': 'कब्ज़े',
  'lock': 'ताला',
  'handle': 'हैंडल / दस्ता',
  'latches': 'चिटकनी / कुंडी',
  'tower': 'टावर बोल्ट',
  'brick': 'ईंट',
  'bricks': 'ईंटें',
  'sand': 'रेत / बालू',
  'stone': 'पत्थर / गिट्टी',
  'chips': 'गिट्टी',
  'tile': 'टाइल',
  'tiles': 'टाइल्स',
  'marble': 'संगमरमर',
  'granite': 'ग्रेनाइट',
  'sheet': 'चादर / शीट',
  'asbestos': 'एस्बेस्टस शीट',
  'tin': 'टिन शेड',
  'tank': 'पानी की टंकी',
  'tap': 'नल / टोंटी',
  'faucet': 'नल',
  'valve': 'वाल्व',
  'hardware': 'हार्डवेयर',
  'electrical': 'इलेक्ट्रिकल',
  'plumbing': 'प्लंबिंग',
  'sanitary': 'सैनिटरी',
  'construction': 'निर्माण सामग्री',
  'tools': 'औज़ार',
  'safety': 'सुरक्षा उपकरण',
};

// 5. General English UI Words Dictionary
export const GENERAL_WORDS: Record<string, string> = {
  'invoice': 'चालान / बिल',
  'bill': 'बिल',
  'receipt': 'रसीद',
  'order': 'ऑर्डर',
  'sale': 'बिक्री',
  'sales': 'बिक्री',
  'sell': 'सामान बेचें',
  'item': 'सामान (आइटम)',
  'items': 'सामान',
  'product': 'उत्पाद / सामान',
  'products': 'सामान सूची',
  'category': 'श्रेणी',
  'categories': 'श्रेणियां',
  'stock': 'स्टॉक',
  'inventory': 'गोदाम स्टॉक',
  'quantity': 'मात्रा',
  'qty': 'मात्रा',
  'price': 'मूल्य (दर)',
  'rate': 'दर',
  'amount': 'राशि',
  'total': 'कुल',
  'subtotal': 'उप-योग',
  'tax': 'कर (टैक्स)',
  'gst': 'जीएसटी',
  'gstin': 'जीएसटी नंबर',
  'customer': 'ग्राहक',
  'customers': 'ग्राहक',
  'phone': 'फोन',
  'address': 'पता',
  'location': 'स्थान',
  'payment': 'भुगतान',
  'method': 'तरीका',
  'status': 'स्थिति',
  'action': 'कार्रवाई',
  'actions': 'कार्रवाई',
  'date': 'दिनांक',
  'time': 'समय',
  'search': 'खोजें...',
  'filter': 'फ़िल्टर',
  'sort': 'क्रमबद्ध करें',
  'save': 'सुरक्षित करें',
  'submit': 'दर्ज करें',
  'cancel': 'रद्द करें',
  'close': 'बंद करें',
  'edit': 'संपादित करें',
  'delete': 'हटाएं',
  'view': 'देखें',
  'print': 'प्रिंट करें',
  'download': 'डाउनलोड करें',
  'export': 'निर्यात करें',
  'import': 'आयात करें',
  'confirm': 'पुष्टि करें',
  'yes': 'हाँ',
  'no': 'नहीं',
  'ok': 'ठीक है',
  'back': 'वापस जाएं',
  'next': 'अगला',
  'previous': 'पिछला',
  'loading': 'लोड हो रहा है...',
  'error': 'त्रुटि',
  'success': 'सफल',
  'warning': 'चेतावनी',
  'verified': 'सत्यापित',
  'admin': 'व्यवस्थापक (Admin)',
  'manager': 'प्रबंधक',
  'cashier': 'कैशियर',
  'notes': 'टिप्पणी / विवरण',
  'code': 'कोड (SKU)',
  'sku': 'एसकेयू कोड',
  'name': 'नाम',
  'description': 'विवरण',
  'counter': 'काउंटर',
  'shop': 'दुकान',
  'store': 'स्टोर',
  'pickup': 'पिकअप',
  'draft': 'कच्चा बिल (ड्राफ्ट)',
  'ready': 'तैयार',
  'in': 'में',
  'to': 'को',
  'from': 'से',
  'by': 'द्वारा',
  'for': 'के लिए',
  'with': 'सहित',
  'and': 'और',
  'or': 'या',
  'of': 'का',
  'at': 'पर',
};

// 6. Phonetic Devanagari Transliterator for arbitrary English words / names
// Converts untranslated English names and addresses into Hindi phonetically
const CONSONANT_MAP: [string, string][] = [
  ['chh', 'छ'],
  ['kh', 'ख'],
  ['gh', 'घ'],
  ['ch', 'च'],
  ['jh', 'झ'],
  ['th', 'थ'],
  ['dh', 'ध'],
  ['bh', 'भ'],
  ['ph', 'फ'],
  ['shh', 'ष'],
  ['sh', 'श'],
  ['tr', 'त्र'],
  ['gy', 'ज्ञ'],
  ['k', 'क'],
  ['g', 'ग'],
  ['j', 'ज'],
  ['t', 'ट'],
  ['d', 'ड'],
  ['n', 'न'],
  ['p', 'प'],
  ['f', 'फ़'],
  ['b', 'ब'],
  ['m', 'म'],
  ['y', 'य'],
  ['r', 'र'],
  ['l', 'ल'],
  ['v', 'व'],
  ['w', 'व'],
  ['s', 'स'],
  ['h', 'ह'],
  ['z', 'ज़'],
  ['q', 'क'],
  ['x', 'क्स'],
  ['c', 'क'],
];

const VOWEL_INITIAL_MAP: [string, string][] = [
  ['aa', 'आ'],
  ['ee', 'ई'],
  ['oo', 'ऊ'],
  ['ai', 'ऐ'],
  ['au', 'औ'],
  ['a', 'अ'],
  ['i', 'इ'],
  ['u', 'उ'],
  ['e', 'ए'],
  ['o', 'ओ'],
];

const MATRA_MAP: [string, string][] = [
  ['aa', 'ा'],
  ['ee', 'ी'],
  ['oo', 'ू'],
  ['ai', 'ै'],
  ['au', 'ौ'],
  ['a', ''], // implicit short 'a'
  ['i', 'ि'],
  ['u', 'ु'],
  ['e', 'े'],
  ['o', 'ो'],
];

/**
 * Phonetically transliterates an English word to Devanagari Hindi
 */
export function transliterateToHindi(word: string): string {
  if (!word || !/^[a-zA-Z]+$/.test(word)) return word;

  const lower = word.toLowerCase();

  // Check direct single word dictionaries first
  if (NAMES_DICTIONARY[lower]) return NAMES_DICTIONARY[lower];
  if (ADDRESS_WORDS[lower]) return ADDRESS_WORDS[lower];
  if (PRODUCT_WORDS[lower]) return PRODUCT_WORDS[lower];
  if (GENERAL_WORDS[lower]) return GENERAL_WORDS[lower];

  let result = '';
  let i = 0;
  const len = lower.length;

  while (i < len) {
    // 1. Initial Vowel Check
    if (i === 0) {
      let matchedVowel = false;
      for (const [key, val] of VOWEL_INITIAL_MAP) {
        if (lower.startsWith(key, i)) {
          result += val;
          i += key.length;
          matchedVowel = true;
          break;
        }
      }
      if (matchedVowel) continue;
    }

    // 2. Consonant match
    let matchedConsonant = '';
    let consLen = 0;
    for (const [key, val] of CONSONANT_MAP) {
      if (lower.startsWith(key, i)) {
        matchedConsonant = val;
        consLen = key.length;
        break;
      }
    }

    if (matchedConsonant) {
      result += matchedConsonant;
      i += consLen;

      // Check following vowel for matra
      let matchedMatra = false;
      for (const [key, val] of MATRA_MAP) {
        if (lower.startsWith(key, i)) {
          result += val;
          i += key.length;
          matchedMatra = true;
          break;
        }
      }

      // If at end or followed by another consonant, implicit 'a' or halant
      // In Devanagari Hindi, trailing consonants usually don't need halant
      continue;
    }

    // 3. Middle vowel if not preceded by consonant
    let matchedMidVowel = false;
    for (const [key, val] of VOWEL_INITIAL_MAP) {
      if (lower.startsWith(key, i)) {
        result += val;
        i += key.length;
        matchedMidVowel = true;
        break;
      }
    }

    if (!matchedMidVowel) {
      // Fallback: advance 1 char
      i++;
    }
  }

  return result || word;
}

/**
 * Master translator: Translates any string into Hindi.
 * Handles phrases, sentences, person names, addresses, numbers, and punctuation.
 */
export function translateToHindi(text: string | null | undefined): string {
  if (!text) return '';
  const trimmed = String(text).trim();
  if (!trimmed) return '';

  const lower = trimmed.toLowerCase();

  // 1. Exact phrase match
  if (PHRASE_DICTIONARY[lower]) {
    return PHRASE_DICTIONARY[lower];
  }
  if (NAMES_DICTIONARY[lower]) {
    return NAMES_DICTIONARY[lower];
  }
  if (ADDRESS_WORDS[lower]) {
    return ADDRESS_WORDS[lower];
  }
  if (PRODUCT_WORDS[lower]) {
    return PRODUCT_WORDS[lower];
  }
  if (GENERAL_WORDS[lower]) {
    return GENERAL_WORDS[lower];
  }

  // 2. Sub-phrase replacements (e.g. "Shop Counter Pickup", "Walk-in Customer", "Near Bus Stand")
  let working = trimmed;
  for (const [phrase, hindiVal] of Object.entries(PHRASE_DICTIONARY)) {
    const regex = new RegExp(`\\b${phrase}\\b`, 'gi');
    if (regex.test(working)) {
      working = working.replace(regex, hindiVal);
    }
  }

  // 3. Tokenize by words and punctuation
  const tokenRegex = /([a-zA-Z]+|[\d,.]+|[^\s\w]+|\s+)/g;
  const tokens = working.match(tokenRegex) || [working];

  const translatedTokens = tokens.map(token => {
    // If it's whitespace or punctuation or numbers, keep as is
    if (/^\s+$/.test(token) || /^[^\s\w]+$/.test(token) || /^[\d,.]+$/.test(token)) {
      return token;
    }

    const tokenLower = token.toLowerCase();

    // Check dictionaries
    if (NAMES_DICTIONARY[tokenLower]) return NAMES_DICTIONARY[tokenLower];
    if (ADDRESS_WORDS[tokenLower]) return ADDRESS_WORDS[tokenLower];
    if (PRODUCT_WORDS[tokenLower]) return PRODUCT_WORDS[tokenLower];
    if (GENERAL_WORDS[tokenLower]) return GENERAL_WORDS[tokenLower];

    // Transliterate phonetic names / addresses
    return transliterateToHindi(token);
  });

  return translatedTokens.join('');
}

/**
 * Converts any number to formal Indian Hindi words (e.g., १५०० -> पंद्रह सौ रुपये मात्र)
 */
export function convertAmountToHindiWords(num: number): string {
  if (isNaN(num) || num <= 0) return 'शून्य रुपये मात्र';

  const units = [
    '', 'एक', 'दो', 'तीन', 'चार', 'पाँच', 'छह', 'सात', 'आठ', 'नौ', 'दस',
    'ग्यारह', 'बारह', 'तेरह', 'चौदह', 'पंद्रह', 'सोलह', 'सत्रह', 'अठारह', 'उन्नीस', 'बीस',
    'इक्कीस', 'बाईस', 'तेईस', 'चौबीस', 'पच्चीस', 'छब्बीस', 'सत्ताईस', 'अट्ठाईस', 'उनतीस', 'तीस',
    'इकतीस', 'बत्तीस', 'तैंतीस', 'चौंतीस', 'पैंतीस', 'छत्तीस', 'सैंतीस', 'अड़तीस', 'उनतालीस', 'चालीस',
    'इकतालीस', 'बयालीस', 'तैंतालीस', 'चवालीस', 'पैंतालीस', 'छियालीस', 'सैंतालीस', 'अड़तालीस', 'उनचास', 'पचास',
    'इक्यावन', 'बावन', 'तिरेपन', 'चौवन', 'पचपन', 'छप्पन', 'सत्तावन', 'अट्ठावन', 'उनसठ', 'साठ',
    'इकसठ', 'बासठ', 'तिरेसठ', 'चौंसठ', 'पैंसठ', 'छियासठ', 'सरसठ', 'अड़सठ', 'उनहत्तर', 'सत्तर',
    'इकहत्तर', 'बहत्तर', 'तिहत्तर', 'चौहत्तर', 'पचहत्तर', 'छिहत्तर', 'सतहत्तर', 'अठहत्तर', 'उन्नासी', 'अस्सी',
    'इक्यासी', 'बयासी', 'तिरासी', 'चौरासी', 'पचासी', 'छियासी', 'सत्तासी', 'अट्ठासी', 'नवासी', 'नब्बे',
    'इक्यानवे', 'बानवे', 'तिरानवे', 'चौरानवे', 'पंचानवे', 'छियानवे', 'सत्तानवे', 'अट्ठानवे', 'निन्यानवे'
  ];

  const inHindi = (n: number): string => {
    if (n <= 0) return '';
    if (n < 100) return units[n] || '';
    return '';
  };

  const integerPart = Math.floor(num);
  const decimalPart = Math.round((num - integerPart) * 100);

  let output = '';
  const crore = Math.floor(integerPart / 10000000);
  let rem = integerPart % 10000000;
  const lakh = Math.floor(rem / 100000);
  rem = rem % 100000;
  const thousand = Math.floor(rem / 1000);
  rem = rem % 1000;
  const hundred = Math.floor(rem / 100);
  const rest = rem % 100;

  if (crore > 0) output += inHindi(crore) + ' करोड़ ';
  if (lakh > 0) output += inHindi(lakh) + ' लाख ';
  if (thousand > 0) output += inHindi(thousand) + ' हज़ार ';
  if (hundred > 0) output += inHindi(hundred) + ' सौ ';
  if (rest > 0) output += inHindi(rest) + ' ';

  output = output.trim();
  if (!output) output = 'शून्य';

  let result = output + ' रुपये';
  if (decimalPart > 0 && decimalPart < 100) {
    result += ' और ' + inHindi(decimalPart) + ' पैसे';
  }
  return result + ' मात्र';
}
