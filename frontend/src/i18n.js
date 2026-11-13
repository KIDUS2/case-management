/**
 * English / Amharic. The page is written in English; when Amharic is chosen, a small translator swaps the
 * wording on screen. Static text is looked up in AM; text with numbers or names uses t('… {n} …', { n }).
 * Changing the language reloads the page, so there is no half-translated state.
 */
export const getLang = () => { try { return localStorage.getItem('lang') === 'am' ? 'am' : 'en' } catch { return 'en' } }
export const setLang = l => { try { localStorage.setItem('lang', l) } catch { /* private mode */ } location.reload() }
export const locale = () => (getLang() === 'am' ? 'am-ET' : undefined)

const AM = {
  // navigation and general
  'Dashboard': 'ዳሽቦርድ', 'Department inbox': 'የመምሪያ ገቢ ጉዳዮች', 'Door queue': 'የበር ወረፋ', 'Register case': 'ጉዳይ መዝግብ',
  'All cases': 'ሁሉም ጉዳዮች', 'Notifications': 'ማሳወቂያዎች', 'Churches': 'አብያተ ክርስቲያናት', 'Departments': 'መምሪያዎች',
  'Users': 'ተጠቃሚዎች', 'My account': 'የእኔ መለያ', 'Log out': 'ውጣ', 'Cases': 'ጉዳዮች', 'Case Desk': 'የጉዳይ ጠረጴዛ',
  'Loading…': 'በመጫን ላይ…', 'Cancel': 'ተው', 'Save': 'አስቀምጥ', 'Edit': 'አስተካክል', 'Remove': 'አስወግድ', 'Open': 'ክፈት',
  'Open case': 'ጉዳዩን ክፈት', 'Search cases': 'ጉዳዮችን ፈልግ', 'Clear search': 'ፍለጋውን አጽዳ', 'All': 'ሁሉም', 'Unread': 'ያልተነበቡ',
  'Next →': 'ቀጣይ →', '← Previous': '← ቀዳሚ', '← Newer': '← አዲስ', 'Older →': 'የቆየ →', '← All cases': '← ሁሉም ጉዳዮች', '← Back': '← ተመለስ',
  'Name': 'ስም', 'Full name': 'ሙሉ ስም', 'Username': 'የተጠቃሚ ስም', 'Password': 'የይለፍ ቃል', 'Role': 'ሚና', 'Church': 'ቤተ ክርስቲያን',
  'Phone (optional)': 'ስልክ (አማራጭ)', '(optional)': '(አማራጭ)', 'Start typing…': 'መጻፍ ይጀምሩ…', 'Something went wrong. Please try again.': 'የሆነ ችግር ተፈጥሯል። እባክዎ እንደገና ይሞክሩ።',
  'Language': 'ቋንቋ', 'Theme': 'ገጽታ', 'Light': 'ብሩህ', 'Dark': 'ጨለማ', 'Automatic': 'ራስ-ሰር', 'Light mode': 'ብሩህ ገጽታ', 'Dark mode': 'ጨለማ ገጽታ', 'Same as device': 'እንደ መሣሪያው',
  // login
  'Welcome! Please sign in to continue.': 'እንኳን ደህና መጡ! ለመቀጠል እባክዎ ይግቡ።', 'Sign in': 'ግባ', 'Signing in…': 'በመግባት ላይ…', 'Wrong username or password': 'የተጠቃሚ ስም ወይም የይለፍ ቃል ትክክል አይደለም',
  // roles
  'Administrator': 'አስተዳዳሪ', 'Case officer': 'የጉዳይ ባለሙያ', 'Reception (door)': 'አቀባበል (በር)', 'Department staff': 'የመምሪያ ሠራተኛ',
  // statuses / categories / working
  'Open (status)': 'ክፍት', 'In a department': 'በመምሪያ ውስጥ', 'In court': 'በፍርድ ቤት', 'Resolved': 'የተፈታ', 'With the desk': 'በጠረጴዛው ላይ', 'Referred': 'የተላለፈ',
  'HR management': 'የሰው ሀብት አስተዳደር', 'Finance': 'ፋይናንስ', 'Management': 'አስተዳደር', 'Court matter': 'የፍርድ ቤት ጉዳይ', 'Not clear yet': 'ገና ግልጽ ያልሆነ',
  'Active employee': 'ንቁ ሠራተኛ', 'Leader / priest': 'መሪ / ካህን', 'Retired': 'ጡረታ የወጣ', 'Suspended': 'የታገደ', 'Contract': 'የኮንትራት', 'Volunteer': 'በጎ ፈቃደኛ',
  'Church member (not an employee)': 'የቤተ ክርስቲያን አባል (ሠራተኛ ያልሆነ)', 'Human Resources': 'የሰው ሀብት', 'Legal': 'የሕግ',
  'Any kind of issue': 'ማንኛውም ዓይነት ጉዳይ',
  // dashboard
  'Total cases': 'ጠቅላላ ጉዳዮች', 'Still active': 'አሁንም በሂደት ላይ', 'Waiting in departments': 'በመምሪያዎች የሚጠባበቁ', 'issues sent, not yet resolved': 'የተላኩ፣ ገና ያልተፈቱ ጉዳዮች',
  'Expected today': 'ዛሬ የሚጠበቁ', 'Court, not acknowledged': 'በፍርድ ቤት፣ ያልተረጋገጠ', 'People served': 'አገልግሎት ያገኙ ሰዎች', 'Churches reached': 'የደረስንባቸው አብያተ ክርስቲያናት',
  'Letters issued': 'የተሰጡ ደብዳቤዎች', 'Church members reporting': 'ጉዳይ ያቀረቡ የቤተ ክርስቲያን አባላት', 'not employees': 'ሠራተኞች ያልሆኑ', 'Employees reported on': 'ክስ የቀረበባቸው ሠራተኞች',
  'Repeat complaints': 'ተደጋጋሚ ቅሬታዎች', 'employees in 2+ cases': 'በ2 እና ከዚያ በላይ ጉዳዮች ያሉ ሠራተኞች', 'Cases per day': 'በቀን የሚመዘገቡ ጉዳዮች', 'last 30 days': 'ያለፉት 30 ቀናት',
  'Cases per day, last 30 days': 'በቀን የሚመዘገቡ ጉዳዮች፣ ያለፉት 30 ቀናት', 'Cases by status': 'ጉዳዮች በደረጃ', 'What people bring': 'ሰዎች የሚያመጡት', 'issues by type': 'ጉዳዮች በዓይነት',
  'Issues by department': 'ጉዳዮች በመምሪያ', 'waiting vs resolved': 'የሚጠባበቁ እና የተፈቱ', 'resolved': 'የተፈቱ', 'waiting': 'የሚጠባበቁ', 'Busiest churches': 'ብዙ ጉዳይ ያላቸው አብያተ ክርስቲያናት',
  'Latest cases': 'የቅርብ ጊዜ ጉዳዮች', 'No cases yet.': 'ገና ምንም ጉዳይ የለም።', 'No departments yet.': 'ገና ምንም መምሪያ የለም።', 'Nothing to show yet.': 'ገና የሚታይ ነገር የለም።',
  'Loading your reports…': 'ሪፖርቶችዎ በመጫን ላይ…', 'cases': 'ጉዳዮች', 'people did not come back on time': 'ሰዎች በተባለው ጊዜ አልተመለሱም', 'expected at the door today': 'ዛሬ በበር የሚጠበቁ',
  'Good morning': 'እንደምን አደሩ', 'Good afternoon': 'እንደምን ዋሉ', 'Good evening': 'እንደምን አመሹ',
  // cases list / detail
  'Every report and request that came to the desk.': 'ወደ ጠረጴዛው የመጡ ሁሉም ሪፖርቶችና ጥያቄዎች።', 'Filter this list by name, church or case code…': 'ዝርዝሩን በስም፣ በቤተ ክርስቲያን ወይም በጉዳይ ኮድ አጣራ…',
  'No cases match your search.': 'ከፍለጋዎ ጋር የሚመሳሰል ጉዳይ የለም።', 'No cases yet. Register the first one!': 'ገና ምንም ጉዳይ የለም። የመጀመሪያውን ይመዝግቡ!',
  'Case code': 'የጉዳይ ኮድ', 'Copy code': 'ኮዱን ቅዳ', 'Copied': 'ተቀድቷል', 'Person is here': 'ሰውየው መጥተዋል',
  'Case registered.': 'ጉዳዩ ተመዝግቧል።', 'Give this code to the person. They can quote it when they come back, and staff can type it to find the case at once.': 'ይህንን ኮድ ለሰውየው ይስጡ። ሲመለሱ ሊጠቅሱት ይችላሉ፤ ሠራተኞችም ጉዳዩን ወዲያውኑ ለማግኘት ሊጽፉት ይችላሉ።',
  'Issues': 'ጉዳዮች (ንዑስ ጉዳዮች)', 'each issue is a sub-case with its own status, department and files': 'እያንዳንዱ ጉዳይ የራሱ ደረጃ፣ መምሪያና ፋይሎች ያሉት ንዑስ ጉዳይ ነው',
  'No detail written yet.': 'ገና ዝርዝር አልተጻፈም።', 'Send to department': 'ወደ መምሪያ ላክ', 'Send to another department': 'ወደ ሌላ መምሪያ ላክ', 'Mark resolved': 'እንደተፈታ ምልክት አድርግ',
  'Take to court': 'ወደ ፍርድ ቤት ውሰድ', 'Attach file': 'ፋይል አያይዝ', 'Acknowledge': 'አረጋግጥ', 'waiting for the admin to acknowledge': 'አስተዳዳሪው እንዲያረጋግጥ በመጠባበቅ ላይ',
  'Department': 'መምሪያ', 'Choose…': 'ይምረጡ…', 'Person comes back on': 'ሰውየው የሚመለሱበት ቀን', 'Note for the department (optional)': 'ለመምሪያው የሚሆን ማስታወሻ (አማራጭ)',
  'Send now': 'አሁን ላክ', 'Sending…': 'በመላክ ላይ…', 'The department is notified straight away, and the person will show in the door queue on that day.': 'መምሪያው ወዲያውኑ ይነገረዋል፤ ሰውየውም በዚያ ቀን በበር ወረፋ ውስጥ ይታያል።',
  'What was done? (the desk and admin are notified)': 'ምን ተደረገ? (ጠረጴዛውና አስተዳዳሪው ይነገራቸዋል)', 'What was done? (this is sent to the desk)': 'ምን ተደረገ? (ይህ ለጠረጴዛው ይላካል)',
  'Attach the paper or proof (optional)': 'ወረቀቱን ወይም ማስረጃውን ያያይዙ (አማራጭ)', 'Confirm resolved': 'መፈታቱን አረጋግጥ', 'Saving…': 'በማስቀመጥ ላይ…',
  'Court details (optional)': 'የፍርድ ቤት ዝርዝር (አማራጭ)', 'Court, case number, next hearing…': 'ፍርድ ቤት፣ የመዝገብ ቁጥር፣ ቀጣይ ቀጠሮ…', 'Mark as in court': 'በፍርድ ቤት እንዳለ ምልክት አድርግ',
  'The admin is notified and must acknowledge it.': 'አስተዳዳሪው ይነገረዋል፤ ማረጋገጥም አለበት።',
  'Discussion notes': 'የውይይት ማስታወሻ', 'No notes were written.': 'ምንም ማስታወሻ አልተጻፈም።', 'Letter issued': 'ደብዳቤ ተሰጥቷል', 'Letter not issued yet': 'ደብዳቤ ገና አልተሰጠም',
  'Undo': 'ቀልብስ', 'Mark as issued': 'እንደተሰጠ ምልክት አድርግ', 'History': 'ታሪክ', 'Add a note to the history…': 'በታሪኩ ላይ ማስታወሻ ጨምር…', 'Add note': 'ማስታወሻ ጨምር',
  'Reported by': 'ያቀረቡት', 'Who it is about': 'ጉዳዩ ስለ ማን ነው', 'No one in particular. This is a request or general matter.': 'የተለየ ሰው የለም። ይህ ጥያቄ ወይም አጠቃላይ ጉዳይ ነው።',
  'Related cases': 'ተዛማጅ ጉዳዮች', 'Add a sub-case': 'ንዑስ ጉዳይ ጨምር', 'New sub-case': 'አዲስ ንዑስ ጉዳይ', 'Add sub-case': 'ንዑስ ጉዳይ ጨምር', 'Please describe the new sub-case, or mark it “Not clear yet”': 'እባክዎ አዲሱን ንዑስ ጉዳይ ይግለጹ ወይም “ገና ግልጽ አይደለም” ይምረጡ', 'Employee ID (given by the church)': 'የሠራተኛ መታወቂያ ቁጥር (በቤተ ክርስቲያኗ የተሰጠ)', 'Employee found': 'ሠራተኛው ተገኝቷል', 'No one with this ID yet. Fill in the details below and they will be saved with this ID.': 'በዚህ መታወቂያ የተመዘገበ ሰው የለም። ከታች ዝርዝሩን ይሙሉ፤ ከዚህ መታወቂያ ጋር ይቀመጣል።', 'Employees': 'ሠራተኞች', 'Register employee': 'ሠራተኛ መዝግብ', 'Edit employee': 'ሠራተኛ አስተካክል', 'Profession': 'ሙያ', 'Position at the church': 'በቤተ ክርስቲያኑ ያለ ኃላፊነት', 'Import list': 'ዝርዝር አስገባ', 'Date of birth': 'የትውልድ ቀን', 'Hired on': 'የተቀጠረበት ቀን', 'Address': 'አድራሻ', 'Gender': 'ፆታ', 'Male': 'ወንድ', 'Female': 'ሴት', 'Notes': 'ማስታወሻ', 'Working status': 'የሥራ ሁኔታ', 'Employee ID (12 digits) or the church’s own number': 'የሠራተኛ መታወቂያ (12 አኃዝ) ወይም የቤተ ክርስቲያኑ ቁጥር', 'No one with this number yet. Fill in the details below; a new employee ID is created when the case is saved.': 'በዚህ ቁጥር የተመዘገበ ሰው የለም። ዝርዝሩን ይሙሉ፤ ጉዳዩ ሲቀመጥ አዲስ የሠራተኛ መታወቂያ ይፈጠራል።', 'The employee ID (12 digits) is created automatically when you save.': 'የሠራተኛ መታወቂያ (12 አኃዝ) ሲያስቀምጡ በራሱ ይፈጠራል።', 'Employee ID': 'የሠራተኛ መታወቂያ', 'Church number': 'የቤተ ክርስቲያን ቁጥር', 'Print ID card': 'መታወቂያ አትም', 'Church’s own number (optional)': 'የቤተ ክርስቲያኑ ቁጥር (አማራጭ)', 'Identity': 'ማንነት', 'Spiritual life': 'መንፈሳዊ ሕይወት', 'Work and contact': 'ሥራና አድራሻ', 'Personal': 'የግል', 'Work': 'ሥራ', 'First name': 'ስም', 'Middle name (father’s name)': 'የአባት ስም', 'Last name (grandfather’s name)': 'የአያት ስም', 'Middle name': 'የአባት ስም', 'Last name': 'የአያት ስም', 'Mother’s name': 'የእናት ስም', 'Christian name': 'የክርስትና ስም', 'Father confessor': 'የንስሐ አባት', 'Service in the church': 'በቤተ ክርስቲያን ያለ አገልግሎት', 'Service': 'አገልግሎት', 'Ordained on': 'የተሾመበት ቀን', 'Photo': 'ፎቶ', 'Add photo': 'ፎቶ ጨምር', 'Change photo': 'ፎቶ ቀይር', 'Renew card': 'ካርድ አድስ', 'Card valid until': 'ካርዱ የሚያገለግልበት እስከ', 'Expired': 'ጊዜው አልፏል', 'Layperson': 'ምእመን', 'Deacon': 'ዲያቆን', 'Priest': 'ካህን', 'Monk': 'መነኩሴ', 'Nun': 'መነኩሲት', 'Chanter': 'ዘማሪ', 'Teacher': 'መምህር', 'Other': 'ሌላ', 'See cases': 'ጉዳዮችን እይ', 'Church’s own number': 'የቤተ ክርስቲያኑ ቁጥር', 'Remove this document?': 'ይህን ሰነድ ልሰርዘው?', 'Renew the card for five more years?': 'ካርዱን ለአምስት ዓመት ላድስ?', 'Card renewed ✅': 'ካርዱ ታድሷል ✅', 'Please allow pop-ups to print the card.': 'ካርዱን ለማተም እባክዎ ብቅ-ባዮችን ይፍቀዱ።', 'Nothing recorded yet.': 'ገና ምንም አልተመዘገበም።', 'No documents yet.': 'ገና ሰነድ የለም።', 'mother': 'እናት', '{n} people on the list. Type an employee ID when registering a case to bring back all their details.': 'በዝርዝሩ ውስጥ {n} ሰዎች አሉ። ጉዳይ ሲመዘግቡ የሠራተኛ መታወቂያ ቁጥር ይጻፉ፤ ሙሉ ዝርዝራቸው ይመጣል።', 'Yes': 'አዎ', 'Remove this file?': 'ይህ ፋይል ይወገድ?', 'Renew the card?': 'ካርዱ ይታደስ?', 'Renew': 'አድስ', 'The new card will be valid for five more years from today.': 'አዲሱ ካርድ ከዛሬ ጀምሮ ለአምስት ዓመት ያገለግላል።', 'New password for {n} (min 6 characters):': 'ለ{n} አዲስ የይለፍ ቃል (ቢያንስ 6 ቁምፊ):', 'Please type at least {n} characters.': 'እባክዎ ቢያንስ {n} ቁምፊ ይጻፉ።', 'Please check this field.': 'እባክዎ ይህን መስክ ያረጋግጡ።', 'Your session has ended. Please sign in again.': 'ክፍለ ጊዜዎ አብቅቷል። እባክዎ እንደገና ይግቡ።', 'Cannot reach the server. Please check the connection and try again.': 'ከአገልጋዩ ጋር መገናኘት አልተቻለም። እባክዎ ግንኙነቱን ያረጋግጡ እና እንደገና ይሞክሩ።', 'Remove “{f}”?': '“{f}” ይወገድ?', 'Addis Ababa Diocese': 'የአዲስ አበባ ሀገረ ስብከት', 'Education': 'ትምህርት', 'Spiritual education': 'መንፈሳዊ ትምህርት', 'Secular education': 'ዘመናዊ ትምህርት', 'Service history': 'የአገልግሎት ታሪክ', 'Level or course': 'ደረጃ ወይም ኮርስ', 'Field of study': 'የትምህርት ዘርፍ', 'School or college': 'ትምህርት ቤት ወይም ኮሌጅ', 'Start year': 'የገባበት ዓመት', 'End year': 'የጨረሰበት ዓመት', 'Completed': 'ጨርሷል', 'studying': 'በመማር ላይ', 'now': 'አሁን', 'Current': 'አሁን ያለበት', 'Add a place of service': 'የአገልግሎት ቦታ ጨምር', 'Church or office': 'ቤተ ክርስቲያን ወይም ቢሮ', 'Position': 'ኃላፊነት', 'From': 'ከ', 'Until (leave empty if still serving)': 'እስከ (አሁንም እያገለገለ ከሆነ ባዶ ይተዉ)', 'Remove this record?': 'ይህ መዝገብ ይወገድ?', 'School': 'ትምህርት ቤት', 'Add': 'ጨምር', 'Login': 'ግባ', 'Login to the platform': 'ወደ መድረኩ ግባ', 'What the platform offers': 'መድረኩ የሚያቀርበው', '← Home': '← መነሻ', 'Ethiopian Orthodox Tewahedo Church': 'የኢትዮጵያ ኦርቶዶክስ ተዋሕዶ ቤተ ክርስቲያን', 'Addis Ababa Diocese Case Desk': 'የአዲስ አበባ ሀገረ ስብከት የጉዳይ አስተዳደር', 'One place to receive, follow and close the cases that reach the diocese from its churches.': 'ከአብያተ ክርስቲያናት ወደ ሀገረ ስብከቱ የሚመጡ ጉዳዮችን ለመቀበል፣ ለመከታተልና ለመዝጋት አንድ ቦታ።', 'Register a case in minutes': 'ጉዳይን በደቂቃዎች ውስጥ ይመዝግቡ', 'Record who came, who it is about and what happened. A short code is created so anyone at the desk can find the case again.': 'ማን እንደመጣ፣ ስለ ማን እንደሆነና ምን እንደተፈጠረ ይመዝግቡ። በጠረጴዛው ያለ ሁሉ ጉዳዩን እንደገና እንዲያገኘው አጭር ኮድ ይፈጠራል።', 'Send issues to the right department': 'ጉዳዮችን ወደ ትክክለኛው ክፍል ይላኩ', 'Each issue goes to HR, Finance, Management or Legal, with a return date. The department sees it in its own inbox.': 'እያንዳንዱ ጉዳይ ከመመለሻ ቀን ጋር ወደ ሰው ሀብት፣ ፋይናንስ፣ አመራር ወይም ሕግ ይላካል። ክፍሉ በራሱ የገቢ መልእክት ሳጥን ያየዋል።', 'Everyone is told at once': 'ሁሉም በአንድ ጊዜ ይነገራል', 'When a department resolves an issue, the person who registered it and the administrator are notified in the app.': 'አንድ ክፍል ጉዳይን ሲፈታ፣ የመዘገበው ሰውና አስተዳዳሪው በመተግበሪያው ማሳወቂያ ይደርሳቸዋል።', 'Employee directory and ID cards': 'የሠራተኞች መዝገብና መታወቂያ ካርዶች', 'A 12-digit employee ID, photo, spiritual and secular education, service history and a printable card with a QR code.': 'ባለ 12 አኃዝ የሠራተኛ መታወቂያ፣ ፎቶ፣ መንፈሳዊና ዘመናዊ ትምህርት፣ የአገልግሎት ታሪክና የQR ኮድ ያለው የሚታተም ካርድ።', 'Each person sees only their cases': 'እያንዳንዱ ሰው የራሱን ጉዳዮች ብቻ ያያል', 'Cases open only to the people who registered them, the departments they were sent to, and anyone the administrator adds.': 'ጉዳዮች የሚከፈቱት ለመዘገቡት ሰዎች፣ ለተላኩላቸው ክፍሎችና አስተዳዳሪው ለጨመራቸው ሰዎች ብቻ ነው።', 'Reports for the diocese': 'ለሀገረ ስብከቱ ሪፖርቶች', 'Cases per day, by status, by department and by church, so the diocese can see where help is needed.': 'በቀን፣ በሁኔታ፣ በክፍልና በቤተ ክርስቲያን የተከፋፈሉ ጉዳዮች፤ ሀገረ ስብከቱ እርዳታ የሚያስፈልግበትን እንዲያይ።', 'Ready to continue?': 'ለመቀጠል ዝግጁ ነዎት?', 'Sign in with the account the administrator gave you.': 'አስተዳዳሪው በሰጠዎት መለያ ይግቡ።', 'Find an existing person': 'ነባር ሰው ፈልግ', 'Name, phone or ID number': 'ስም፣ ስልክ ወይም መታወቂያ ቁጥር', 'No one found. Fill in the details below to add a new person.': 'ማንም አልተገኘም። አዲስ ሰው ለመጨመር ዝርዝሩን ከታች ይሙሉ።', 'Choose an Excel (.xlsx) or CSV file': 'የኤክሴል (.xlsx) ወይም CSV ፋይል ይምረጡ', 'Download the template': 'ናሙናውን አውርድ', 'Or paste': 'ወይም ለጥፍ', 'No church names found in this file.': 'በዚህ ፋይል ውስጥ የቤተ ክርስቲያን ስም አልተገኘም።', 'The list is empty. The first line must hold the column names, then one employee per line.': 'ዝርዝሩ ባዶ ነው። የመጀመሪያው መስመር የአምዶች ስም፣ ከዚያ በመስመር አንድ ሠራተኛ መያዝ አለበት።', 'Upload an Excel (.xlsx) or CSV file with one church per row. Use a column called “name”, or put the names in the first column. Names already on the list are skipped.': 'በአንድ ረድፍ አንድ ቤተ ክርስቲያን ያለው የኤክሴል (.xlsx) ወይም CSV ፋይል ይጫኑ። “name” የሚል አምድ ይጠቀሙ ወይም ስሞቹን በመጀመሪያው አምድ ያስቀምጡ። ቀድሞ ያሉ ስሞች ይዘለላሉ።', 'Summary': 'ማጠቃለያ', 'Time period': 'የጊዜ ክልል', 'This month': 'ይህ ወር', 'Last 30 days': 'ያለፉት 30 ቀናት', 'All time': 'ሁሉም ጊዜ', 'Choose dates': 'ቀን ምረጥ', 'To': 'እስከ', '{a} cases in this period · {b} still being handled.': 'በዚህ ጊዜ {a} ጉዳዮች · {b} አሁንም በመስተናገድ ላይ።', 'Showing all cases since the start.': 'ከመጀመሪያ ጀምሮ ሁሉም ጉዳዮች ይታያሉ።', 'Showing cases registered {r}.': 'የተመዘገቡ ጉዳዮች ይታያሉ፦ {r}።', 'All cases in one place. Choose a period, then narrow down by status, department or name.': 'ሁሉም ጉዳዮች በአንድ ቦታ። ጊዜ ይምረጡ፣ ከዚያ በሁኔታ፣ በክፍል ወይም በስም ያጥቡ።', 'Any status': 'ማንኛውም ሁኔታ', 'Any department': 'ማንኛውም ክፍል', 'Name, church or case code': 'ስም፣ ቤተ ክርስቲያን ወይም የጉዳይ ኮድ', 'Issues resolved': 'የተፈቱ', 'Waiting on a church comment': 'የቤተ ክርስቲያን አስተያየት የሚጠብቁ', 'Waiting for your decision': 'ውሳኔዎን የሚጠብቁ', 'Church replies waiting for the administrator': 'አስተዳዳሪውን የሚጠብቁ የቤተ ክርስቲያን ምላሾች', 'Decide': 'ወስን', 'By status': 'በሁኔታ', 'By type of issue': 'በጉዳይ ዓይነት', 'By department': 'በክፍል', 'By church': 'በቤተ ክርስቲያን', 'All cases in this view': 'በዚህ እይታ ያሉ ሁሉም ጉዳዮች', 'Download as CSV': 'እንደ CSV አውርድ', 'No cases match these filters.': 'ከእነዚህ ማጣሪያዎች ጋር የሚስማማ ጉዳይ የለም።', 'Nothing in this period.': 'በዚህ ጊዜ ምንም የለም።', 'Code': 'ኮድ', 'Registered': 'የተመዘገበ', 'Status': 'ሁኔታ', 'about': 'ስለ', 'Church comment in progress': 'የቤተ ክርስቲያን አስተያየት በሂደት ላይ', 'Previous': 'ቀዳሚ', 'Next': 'ቀጣይ', 'Page {a} of {b}': 'ገጽ {a} ከ {b}', 'Very many cases match. Showing the newest 5000; narrow the period to see them all.': 'እጅግ ብዙ ጉዳዮች ተገኝተዋል። አዲሶቹ 5000 ይታያሉ፤ ሁሉንም ለማየት ጊዜውን ያጥቡ።', '{n}% resolved': '{n}% ተፈቷል', 'Waiting for the church': 'ቤተ ክርስቲያኑን በመጠበቅ ላይ', 'Church replied · waiting for the administrator': 'ቤተ ክርስቲያኑ መልሷል · አስተዳዳሪውን በመጠበቅ ላይ', 'Decided · church agreed': 'ተወስኗል · ቤተ ክርስቲያኑ ተስማምቷል', 'Church did not agree': 'ቤተ ክርስቲያኑ አልተስማማም', 'Comments to the church': 'ለቤተ ክርስቲያን የሚላኩ አስተያየቶች', 'Send a comment to the church. When the church replies, record what they found and attach their letter. The administrator then discusses it and decides.': 'ለቤተ ክርስቲያኑ አስተያየት ይላኩ። ቤተ ክርስቲያኑ ሲመልስ ያገኘውን ይመዝግቡ፣ ደብዳቤውንም ያያይዙ። አስተዳዳሪው ተወያይቶ ይወስናል።', 'Comment sent to the church': 'ወደ ቤተ ክርስቲያኑ የተላከ አስተያየት', 'What the church found and replied': 'ቤተ ክርስቲያኑ ያገኘውና የመለሰው', 'Recorded by': 'የመዘገበው', 'Administrator’s decision': 'የአስተዳዳሪው ውሳኔ', 'the church agreed': 'ቤተ ክርስቲያኑ ተስማምቷል', 'the church did not agree': 'ቤተ ክርስቲያኑ አልተስማማም', 'Everyone on this case was notified. The church can reply again below and the administrator can decide again.': 'በዚህ ጉዳይ ያሉ ሁሉ ተነግሯቸዋል። ቤተ ክርስቲያኑ ከታች እንደገና መመለስ ይችላል፣ አስተዳዳሪውም እንደገና መወሰን ይችላል።', 'Record a new reply from the church': 'አዲስ የቤተ ክርስቲያን ምላሽ ይመዝግቡ', 'Record the church’s reply': 'የቤተ ክርስቲያኑን ምላሽ ይመዝግቡ', 'What did the church find? Write their answer here and attach their letter or evidence.': 'ቤተ ክርስቲያኑ ምን አገኘ? መልሱን እዚህ ይጻፉ፣ ደብዳቤውን ወይም ማስረጃውን ያያይዙ።', 'Save the church’s reply': 'የቤተ ክርስቲያኑን ምላሽ አስቀምጥ', 'Your discussion and decision': 'ውይይትዎና ውሳኔዎ', 'Based on the church’s findings, what is decided?': 'በቤተ ክርስቲያኑ ግኝት መሠረት ምን ተወሰነ?', 'The church agrees': 'ቤተ ክርስቲያኑ ተስማምቷል', 'The church does not agree': 'ቤተ ክርስቲያኑ አልተስማማም', 'Save the decision and tell everyone': 'ውሳኔውን አስቀምጥ ለሁሉም አሳውቅ', 'Which issue is it about? (optional)': 'ስለየትኛው ጉዳይ ነው? (አማራጭ)', 'The whole case': 'ሙሉው ጉዳይ', 'Issue': 'ጉዳይ', 'Comment for the church': 'ለቤተ ክርስቲያኑ አስተያየት', 'What do you need the church to explain, check or send?': 'ቤተ ክርስቲያኑ ምን እንዲያብራራ፣ እንዲፈትሽ ወይም እንዲልክ ይፈልጋሉ?', 'Send comment to the church': 'አስተያየቱን ለቤተ ክርስቲያኑ ላክ', 'Attach files (PDF, image, Word, Excel · up to 10 MB each)': 'ፋይሎችን ያያይዙ (PDF፣ ምስል፣ Word፣ Excel · እስከ 10 MB)', 'Comment to the church': 'ለቤተ ክርስቲያን አስተያየት', 'Church reply': 'የቤተ ክርስቲያን ምላሽ', 'The comment was sent, but these files were not saved: {f}': 'አስተያየቱ ተልኳል፣ ነገር ግን እነዚህ ፋይሎች አልተቀመጡም፦ {f}', 'The reply was saved, but these files were not: {f}': 'ምላሹ ተቀምጧል፣ ነገር ግን እነዚህ ፋይሎች አልተቀመጡም፦ {f}', 'Urgent': 'አስቸኳይ', '{n} days late': '{n} ቀን አልፏል', 'Escalated to the administrator': 'ወደ አስተዳዳሪው ተላልፏል', 'in line': 'በተራ', 'Past its date': 'ቀኑን አልፏል', 'The administrator has been told': 'አስተዳዳሪው ተነግሮታል', 'Place in the department queue': 'በክፍሉ ወረፋ ውስጥ ያለው ቦታ', 'The administrator marked this urgent. Serve it first.': 'አስተዳዳሪው አስቸኳይ አድርጎታል። መጀመሪያ ያስተናግዱት።', 'Remove urgent': 'አስቸኳይነትን አስወግድ', 'Mark urgent': 'አስቸኳይ አድርግ', 'Serve the cases ahead of this one first, or ask the administrator to mark it urgent.': 'ከዚህ በፊት ያሉትን ጉዳዮች መጀመሪያ ያስተናግዱ፣ ወይም አስተዳዳሪው አስቸኳይ እንዲያደርገው ይጠይቁ።', 'They are listed in the order they must be served: urgent first, then first come, first served.': 'መስተናገድ ባለባቸው ቅደም ተከተል ተዘርዝረዋል፦ አስቸኳይ መጀመሪያ፣ ከዚያ ቀድሞ የመጣ ቀድሞ ይስተናገዳል።', 'Sub-city': 'ክፍለ ከተማ', 'Sub-city': 'ክፍለ ከተማ', 'Not set': 'አልተገለጸም', 'Late in departments': 'በክፍሎች የዘገዩ', 'Urgent right now': 'አሁን አስቸኳይ የሆኑ', 'Late: not solved by the date': 'የዘገዩ፦ በቀኑ ያልተፈቱ', 'These issues passed their date in the department. The administrator was told automatically.': 'እነዚህ ጉዳዮች በክፍሉ ውስጥ ቀናቸውን አልፈዋል። አስተዳዳሪው በራስ-ሰር ተነግሮታል።', 'Issues by sub-city': 'ጉዳዮች በክፍለ ከተማ', 'Where the issues come from, and what kind they are.': 'ጉዳዮቹ ከየት እንደሚመጡና ምን ዓይነት እንደሆኑ።', 'Most common issue': 'በጣም የተለመደው ጉዳይ', 'Issues involving leaders and priests': 'መሪዎችንና ካህናትን የሚመለከቱ ጉዳዮች', 'Leader': 'መሪ', 'Case': 'ጉዳይ', 'In the case': 'በጉዳዩ ውስጥ', 'Reported on': 'የተመለከተበት', 'Reported': 'አመልካች', 'One church per line. After the name you can add the sub-city, separated by a comma or a tab.': 'በአንድ መስመር አንድ ቤተ ክርስቲያን። ከስሙ በኋላ ክፍለ ከተማውን በኮማ ወይም በታብ ተለይተው ማከል ይችላሉ።', 'Upload an Excel (.xlsx) or CSV file with one church per row. Use a column called “name” and a column called “subcity” (sub-city), or put the names in the first column. Churches already on the list are skipped, but get their sub-city filled in if it was empty.': 'በአንድ ረድፍ አንድ ቤተ ክርስቲያን ያለው የኤክሴል (.xlsx) ወይም CSV ፋይል ይጫኑ። “name” እና “subcity” (ክፍለ ከተማ) የሚሉ አምዶችን ይጠቀሙ ወይም ስሞቹን በመጀመሪያው አምድ ያስቀምጡ። ቀድሞ ያሉ ቤተ ክርስቲያናት ይዘለላሉ፣ ክፍለ ከተማቸው ባዶ ከነበረ ግን ይሞላል።', 'Link another case': 'ሌላ ጉዳይ አገናኝ', 'Case code, e.g. K7M-2QX': 'የጉዳይ ኮድ፣ ለምሳሌ K7M-2QX', 'Remove link': 'ግንኙነቱን አስወግድ', 'None of these people are in another case.': 'ከእነዚህ ሰዎች ውስጥ በሌላ ጉዳይ ያለ የለም።',
  'Other people involved': 'ሌሎች የተሳተፉ ሰዎች', 'No one else has been called in yet.': 'ገና ሌላ ሰው አልተጠራም።', 'Call in another person': 'ሌላ ሰው ጥራ',
  'Who are they to this case?': 'ከዚህ ጉዳይ ጋር ያላቸው ግንኙነት ምንድን ነው?', 'Called in / involved (witness, accountant, other employee…)': 'የተጠራ / የተሳተፈ (ምስክር፣ ሂሳብ ሠራተኛ፣ ሌላ ሠራተኛ…)',
  'Another person the case is about': 'ጉዳዩ የሚመለከተው ሌላ ሰው', 'Another person reporting': 'ጉዳይ የሚያቀርብ ሌላ ሰው', 'This person is': 'ይህ ሰው',
  'What are they involved in? (what they said or provided)': 'በምን ተሳትፈዋል? (የተናገሩት ወይም ያቀረቡት)', 'e.g. Cashier in 2024, handed over the cash book.': 'ለምሳሌ፦ በ2016 ገንዘብ ተቀባይ ነበሩ፤ የገንዘብ መዝገቡን አስረክበዋል።',
  'Add to case': 'ወደ ጉዳዩ ጨምር', 'Adding…': 'በመጨመር ላይ…', 'Add their paper afterwards with “Attach file” on the issue, or in Documents.': 'ወረቀታቸውን በኋላ በጉዳዩ ላይ “ፋይል አያይዝ” ወይም በሰነዶች ውስጥ ይጨምሩ።',
  'Documents': 'ሰነዶች', 'No files yet. Add the letter, scans or evidence.': 'ገና ምንም ፋይል የለም። ደብዳቤውን፣ ስካኖችን ወይም ማስረጃዎችን ይጨምሩ።', 'Uploading…': 'በመጫን ላይ…',
  'Add files (PDF, image, Word, Excel · up to 10 MB each)': 'ፋይሎችን ጨምር (PDF፣ ምስል፣ Word፣ Excel · እያንዳንዳቸው እስከ 10 MB)', 'Choose files (PDF, image, Word, Excel · up to 10 MB each)': 'ፋይሎችን ምረጥ (PDF፣ ምስል፣ Word፣ Excel · እያንዳንዳቸው እስከ 10 MB)',
  'No match for': 'ምንም አልተገኘም፦',
  // register form
  'Register a case': 'ጉዳይ ይመዝግቡ', 'Listen first, then record. A short code is created when you save.': 'መጀመሪያ ያዳምጡ፣ ከዚያ ይመዝግቡ። ሲያስቀምጡ አጭር ኮድ ይፈጠራል።',
  'Who is reporting?': 'ማን እያቀረበ ነው?', 'One employee, a group of employees asking together, or a church member who is not an employee. Add everyone who came.': 'አንድ ሠራተኛ፣ በጋራ የሚጠይቁ የሠራተኞች ቡድን፣ ወይም ሠራተኛ ያልሆነ የቤተ ክርስቲያን አባል። የመጡትን ሁሉ ይጨምሩ።',
  'Person reporting': 'ጉዳይ የሚያቀርበው ሰው', 'Add another person (group)': 'ሌላ ሰው ጨምር (ቡድን)', 'Who is it about?': 'ጉዳዩ ስለ ማን ነው?',
  'If the report is about an employee or a leader, add them here. Leave empty for a request or general matter.': 'ሪፖርቱ ስለ ሠራተኛ ወይም መሪ ከሆነ እዚህ ይጨምሩ። ለጥያቄ ወይም አጠቃላይ ጉዳይ ባዶ ይተዉት።',
  'Add an employee or leader': 'ሠራተኛ ወይም መሪ ጨምር', 'What are the issues?': 'ጉዳዮቹ ምንድን ናቸው?', 'Add each issue separately. Not sure yet? Choose “Not clear yet”.': 'እያንዳንዱን ጉዳይ ለየብቻ ይጨምሩ። ገና እርግጠኛ አይደሉም? “ገና ግልጽ ያልሆነ” ይምረጡ።',
  'Describe the cause…': 'መንስኤውን ይግለጹ…', 'Send to a department now? (optional)': 'አሁን ወደ መምሪያ ይላክ? (አማራጭ)', 'Keep with the desk for now': 'ለአሁን በጠረጴዛው ላይ ይቆይ',
  'Add another issue': 'ሌላ ጉዳይ ጨምር', 'Discussion & letter': 'ውይይት እና ደብዳቤ', 'Discussion notes ': 'የውይይት ማስታወሻ', 'What was discussed and agreed…': 'የተወያዩበትና የተስማሙበት…',
  'A letter has been issued': 'ደብዳቤ ተሰጥቷል', 'Save case and get code': 'ጉዳዩን አስቀምጥና ኮድ ውሰድ', 'Documents ': 'ሰነዶች', 'Attach the letter, scans or evidence. They are saved with the case.': 'ደብዳቤውን፣ ስካኖችን ወይም ማስረጃዎችን ያያይዙ። ከጉዳዩ ጋር ይቀመጣሉ።',
  'Use these details': 'እነዚህን ዝርዝሮች ተጠቀም', 'Already on record:': 'ቀድሞ በመዝገብ ላይ አለ፦', 'Add the church list first →': 'መጀመሪያ የአብያተ ክርስቲያናት ዝርዝር ይጨምሩ →',
  'Ask an administrator to add the church list.': 'አስተዳዳሪው የአብያተ ክርስቲያናት ዝርዝር እንዲጨምር ይጠይቁ።',
  // queue / inbox
  'People who were asked to come back. Mark them “Arrived” when they reach the door.': 'እንዲመለሱ የተጠየቁ ሰዎች። በር ላይ ሲደርሱ “መጥተዋል” ብለው ምልክት ያድርጉ።', 'Filter this list by name, church or code…': 'ዝርዝሩን በስም፣ በቤተ ክርስቲያን ወይም በኮድ አጣራ…',
  'Nobody is expected back right now.': 'አሁን የሚጠበቅ ሰው የለም።', 'Overdue': 'ጊዜው ያለፈበት', 'Should have come already': 'አስቀድመው መምጣት ነበረባቸው', 'Today': 'ዛሬ', 'Expected at the door today': 'ዛሬ በበር የሚጠበቁ',
  'Tomorrow': 'ነገ', 'This week': 'በዚህ ሳምንት', 'Later': 'ቆይቶ', 'Arrived': 'መጥተዋል', 'Waiting': 'በመጠበቅ ላይ', 'Department inbox ': 'የመምሪያ ገቢ ጉዳዮች',
  'Nothing is waiting. Great work!': 'የሚጠብቅ ነገር የለም። መልካም ሥራ!', 'Nothing resolved yet.': 'ገና ምንም አልተፈታም።', 'Resolve': 'ፍታ', 'No detail written.': 'ዝርዝር አልተጻፈም።',
  'Resolved. The person who registered the case and the admin have been notified.': 'ተፈቷል። ጉዳዩን የመዘገበው ሰውና አስተዳዳሪው ተነግሯቸዋል።',
  // notifications / account
  'News about the cases you registered or the issues sent to your department.': 'ስለመዘገቧቸው ጉዳዮች ወይም ለመምሪያዎ ስለተላኩ ጉዳዮች የሚገኙ ዜናዎች።', 'Mark all read': 'ሁሉንም እንደተነበበ ምልክት አድርግ', 'Mark all as read': 'ሁሉንም እንደተነበበ ምልክት አድርግ',
  'See all notifications →': 'ሁሉንም ማሳወቂያዎች ይመልከቱ →', 'You are all caught up.': 'ሁሉንም ጨርሰዋል።', 'You are all caught up. 🎉': 'ሁሉንም ጨርሰዋል። 🎉', 'No notifications yet.': 'ገና ምንም ማሳወቂያ የለም።',
  'Your sign-in details.': 'የመግቢያ ዝርዝሮችዎ።', 'Profile': 'መገለጫ', 'Change password': 'የይለፍ ቃል ቀይር', 'Current password': 'የአሁኑ የይለፍ ቃል', 'New password (at least 6 characters)': 'አዲስ የይለፍ ቃል (ቢያንስ 6 ቁምፊዎች)',
  'New password again': 'አዲሱን የይለፍ ቃል እንደገና ያስገቡ', 'Password changed': 'የይለፍ ቃል ተቀይሯል', 'The two new passwords do not match.': 'ሁለቱ አዲስ የይለፍ ቃሎች አይዛመዱም።',
  // search
  'Search a name, church or case code…': 'ስም፣ ቤተ ክርስቲያን ወይም የጉዳይ ኮድ ይፈልጉ…', 'Keep typing…': 'መጻፍዎን ይቀጥሉ…', 'Searching…': 'በመፈለግ ላይ…',
  // users / departments / churches
  'Add staff and choose what each person can do. Department staff only see the issues sent to their own department.': 'ሠራተኞችን ይጨምሩ እና እያንዳንዱ ሰው ምን ማድረግ እንደሚችል ይምረጡ። የመምሪያ ሠራተኞች ለራሳቸው መምሪያ የተላኩ ጉዳዮችን ብቻ ያያሉ።',
  'Add user': 'ተጠቃሚ ጨምር', 'Choose the department…': 'መምሪያውን ይምረጡ…', 'Search by name or username…': 'በስም ወይም በተጠቃሚ ስም ፈልግ…', 'All roles': 'ሁሉም ሚናዎች', 'Edit name': 'ስም አስተካክል', 'Reset password': 'የይለፍ ቃል ዳግም አስጀምር',
  'Deactivate': 'አቦዝን', 'Activate': 'አንቃ', 'No users match.': 'የሚመሳሰል ተጠቃሚ የለም።', 'User added': 'ተጠቃሚ ተጨምሯል',
  'The offices that receive issues (HR, Finance, Legal…). Add, rename or switch them off. Staff accounts are linked to a department in': 'ጉዳዮችን የሚቀበሉ ቢሮዎች (የሰው ሀብት፣ ፋይናንስ፣ ሕግ…)። ይጨምሩ፣ ስም ይቀይሩ ወይም ያጥፏቸው። የሠራተኛ መለያዎች ከመምሪያ ጋር የሚያያዙት በ',
  'Department name': 'የመምሪያ ስም', 'Normally handles': 'በተለምዶ የሚያስተናግደው', 'Add department': 'መምሪያ ጨምር', 'Switch off': 'አጥፋ', 'Switch on': 'አብራ', 'No departments yet.': 'ገና ምንም መምሪያ የለም።', 'Department added': 'መምሪያ ተጨምሯል',
  'Church name': 'የቤተ ክርስቲያን ስም', 'Add church': 'ቤተ ክርስቲያን ጨምር', 'Add one church': 'አንድ ቤተ ክርስቲያን ጨምር', 'Paste many at once': 'ብዙዎችን በአንድ ጊዜ ለጥፍ', 'Add all': 'ሁሉንም ጨምር', 'Search churches…': 'አብያተ ክርስቲያናትን ፈልግ…',
  'One church name per line. Names already on the list are skipped.': 'በአንድ መስመር አንድ የቤተ ክርስቲያን ስም። ቀድሞ በዝርዝሩ ላይ ያሉ ስሞች ይዘለላሉ።', 'Church one\nChurch two\nChurch three': 'የመጀመሪያ ቤተ ክርስቲያን\nሁለተኛ ቤተ ክርስቲያን\nሦስተኛ ቤተ ክርስቲያን',
  // backend messages
  'Edit details': 'ዝርዝር አስተካክል', 'Details': 'ዝርዝር', 'Email': 'ኢሜይል', 'Email (optional)': 'ኢሜይል (አማራጭ)', 'Job title': 'የሥራ መደብ', 'Job title (optional)': 'የሥራ መደብ (አማራጭ)', 'Phone': 'ስልክ',
  'Your details and sign-in.': 'ዝርዝርዎ እና የመግቢያ መረጃዎ።', 'Your username, role and department are set by the administrator.': 'የተጠቃሚ ስምዎ፣ ሚናዎ እና መምሪያዎ በአስተዳዳሪው ይወሰናሉ።', 'e.g. Finance officer': 'ለምሳሌ፦ የፋይናንስ ባለሙያ',
  'e.g. Salary difference paid on 12 Nov.': 'ለምሳሌ፦ የደመወዝ ልዩነት በኅዳር 12 ተከፍሏል።', 'Save profile': 'መገለጫ አስቀምጥ', 'Profile saved': 'መገለጫ ተቀምጧል', 'switched off': 'ጠፍቷል',
  'Sees only cases they registered or were added to': 'የሚያየው የመዘገባቸውን ወይም የተጨመረባቸውን ጉዳዮች ብቻ ነው', 'Can see every case': 'ሁሉንም ጉዳዮች ማየት ይችላል', 'Can see every case (otherwise only cases they registered or are added to)': 'ሁሉንም ጉዳዮች ማየት ይችላል (አለበለዚያ የመዘገቧቸውን ወይም የተጨመሩባቸውን ጉዳዮች ብቻ)',
  'Who can open this case': 'ይህንን ጉዳይ ማን መክፈት ይችላል', 'Nobody else has been added.': 'ሌላ ማንም አልተጨመረም።', 'Add a person…': 'ሰው ጨምር…', 'Give access': 'መዳረሻ ስጥ', 'You do not have access to this case. Ask the administrator to add you to it.': 'ወደዚህ ጉዳይ መዳረሻ የለዎትም። አስተዳዳሪው እንዲጨምርዎት ይጠይቁ።',
  'You only see cases you registered, cases you were added to, or issues sent to your department.': 'የሚያዩት የመዘገቧቸውን፣ የተጨመሩባቸውን ወይም ለመምሪያዎ የተላኩ ጉዳዮችን ብቻ ነው።',
  'You can now open this case.': 'አሁን ይህንን ጉዳይ መክፈት ይችላሉ።', 
  'Case registered': 'ጉዳዩ ተመዝግቧል', 'Person came back to the door': 'ሰውየው በር ላይ ተመልሰው መጥተዋል', 'Letter issued ': 'ደብዳቤ ተሰጥቷል', 'Letter marked as not issued': 'ደብዳቤው እንዳልተሰጠ ምልክት ተደርጓል',
  'Needs your acknowledgment': 'የእርስዎን ማረጋገጫ ይፈልጋል', 'No case has that code. Please check it and try again.': 'ይህ ኮድ ያለው ጉዳይ የለም። እባክዎ ያረጋግጡ እና እንደገና ይሞክሩ።',
  'Your current password is not correct': 'የአሁኑ የይለፍ ቃልዎ ትክክል አይደለም', 'That username is already taken': 'ይህ የተጠቃሚ ስም ተይዟል', 'That issue is already resolved': 'ይህ ጉዳይ አስቀድሞ ተፈቷል',
  'This case is not assigned to your department': 'ይህ ጉዳይ ለመምሪያዎ አልተመደበም', 'Please write a note': 'እባክዎ ማስታወሻ ይጻፉ', 'A department with that name already exists': 'ይህ ስም ያለው መምሪያ አስቀድሞ አለ',
  'Please choose a file': 'እባክዎ ፋይል ይምረጡ', 'That file is too large (the limit is 10 MB)': 'ፋይሉ በጣም ትልቅ ነው (ገደቡ 10 MB ነው)', 'That file type is not allowed. Use PDF, image, Word, Excel or text files.': 'ይህ የፋይል ዓይነት አይፈቀድም። PDF፣ ምስል፣ Word፣ Excel ወይም የጽሑፍ ፋይሎችን ይጠቀሙ።',
  'Case not found': 'ጉዳዩ አልተገኘም', 'File not found': 'ፋይሉ አልተገኘም', 'You can’t deactivate or demote your own account': 'የራስዎን መለያ ማቦዘን ወይም ደረጃ መቀነስ አይችሉም',
  'Staff & payroll': 'ሠራተኞችና ደመወዝ', 'Who works in each church, in what position, and what the church costs every month. Only you can see salaries.': 'በእያንዳንዱ ቤተ ክርስቲያን ማን በምን ኃላፊነት እንደሚሠራና ቤተ ክርስቲያኑ በየወሩ ምን ያህል እንደሚያስወጣ። ደመወዝን እርስዎ ብቻ ያያሉ።', 'Employees on staff': 'በሥራ ላይ ያሉ ሠራተኞች', 'Leaders and priests': 'መሪዎችና ካህናት', 'Monthly payroll (birr)': 'ወርሃዊ ደመወዝ (ብር)', 'Without a salary on record': 'ደመወዝ ያልተመዘገበላቸው', 'By sub-city': 'በክፍለ ከተማ', 'Monthly salary (birr)': 'ወርሃዊ ደመወዝ (ብር)', 'Monthly salary': 'ወርሃዊ ደመወዝ', 'birr': 'ብር', 'No position': 'ኃላፊነት የለም', 'No staff registered for this church yet.': 'ለዚህ ቤተ ክርስቲያን ገና ሠራተኛ አልተመዘገበም።', 'Name': 'ስም', 'Position': 'ኃላፊነት', 'Sort by': 'ደርድር በ', 'Highest payroll': 'ከፍተኛ ደመወዝ', 'Most employees': 'ብዙ ሠራተኛ', '{n} without salary': '{n} ደመወዝ የሌላቸው', 'Reported the case': 'ጉዳዩን ያመለከተ', 'Reported on': 'የተመለከተበት', 'Reported and reported on': 'አመልካችም ተመልካችም', 'Court': 'ፍርድ ቤት', '{n} more cases you do not have access to.': 'ሌሎች {n} ጉዳዮች መዳረሻ የለዎትም።',
    'Identity, position and contact': 'ማንነት፣ ኃላፊነትና አድራሻ', 'Places served': 'ያገለገለባቸው ቦታዎች', 'Add to the list': 'ወደ ዝርዝሩ ጨምር', 'Back': 'ተመለስ',
  'The church and position you entered in step 1 are recorded as the current place of service. Add the places served before, and any other role held now, here. The same church can be added again with a different position.': 'በደረጃ 1 የጻፉት ቤተ ክርስቲያንና ኃላፊነት እንደ አሁኑ የአገልግሎት ቦታ ይመዘገባል። ከዚህ በፊት ያገለገለባቸውን ቦታዎችና አሁን ያሉትን ሌሎች ኃላፊነቶች እዚህ ይጨምሩ። አንድ ቤተ ክርስቲያን በሌላ ኃላፊነት እንደገና ሊጨመር ይችላል።', 'These were not saved: {f}': 'እነዚህ አልተቀመጡም፦ {f}',
    'Sub-city': 'ክፍለ ከተማ', 'Sub-cities': 'ክፍለ ከተሞች', 'Sub-cities in use': 'ጥቅም ላይ ያሉ ክፍለ ከተሞች', 'Without a sub-city': 'ክፍለ ከተማ የሌላቸው', 'All sub-cities': 'ሁሉም ክፍለ ከተሞች', 'Import': 'አስገባ', 'Add church': 'ቤተ ክርስቲያን ጨምር', 'One church': 'አንድ ቤተ ክርስቲያን', 'From a file': 'ከፋይል', 'Paste a list': 'ዝርዝር ለጥፍ', 'Close': 'ዝጋ', 'Church name': 'የቤተ ክርስቲያን ስም', 'Save church': 'ቤተ ክርስቲያን አስቀምጥ', 'Add all': 'ሁሉንም ጨምር', 'Search churches…': 'ቤተ ክርስቲያን ፈልግ…', 'No match.': 'የሚስማማ የለም።', 'The list is empty. Add the first church.': 'ዝርዝሩ ባዶ ነው። የመጀመሪያውን ቤተ ክርስቲያን ይጨምሩ።', 'Church added ⛪': 'ቤተ ክርስቲያን ተጨምሯል ⛪', 'These appear when registering a case.': 'ጉዳይ ሲመዘገብ እነዚህ ይታያሉ።', 'Added {a}, filled in the sub-city of {b}, skipped {c} that were already there.': '{a} ተጨምሯል፣ የ{b} ክፍለ ከተማ ተሞልቷል፣ ቀድሞ የነበሩ {c} ተዘልለዋል።', 'Churches': 'አብያተ ክርስቲያናት',
    'Settings': 'ቅንብሮች', 'These lists fill the dropdowns in the whole app. Add a new entry here and it appears in every form, filter and report.': 'እነዚህ ዝርዝሮች በመተግበሪያው ያሉትን ሁሉንም ምርጫዎች ይሞላሉ። እዚህ አዲስ ሲጨምሩ በሁሉም ቅጽ፣ ማጣሪያና ሪፖርት ይታያል።',
  'Types of issue': 'የጉዳይ ዓይነቶች', 'Shown when registering a case or a sub-case, and when choosing what a department handles.': 'ጉዳይ ወይም ንዑስ ጉዳይ ሲመዘገብና ክፍል የሚያስተናግደውን ሲመርጡ ይታያል።',
  'Churches are grouped by these. Renaming one moves its churches along.': 'አብያተ ክርስቲያናት በእነዚህ ይመደባሉ። ስም ሲቀይሩ አብያተ ክርስቲያናቱ አብረው ይዛወራሉ።',
  'Name in English': 'ስም በእንግሊዝኛ', 'Name in Amharic (optional)': 'ስም በአማርኛ (አማራጭ)', 'Added. It now shows in every list.': 'ተጨምሯል። አሁን በሁሉም ዝርዝር ይታያል።', 'Saved': 'ተቀምጧል',
  'Delete “{n}”?': '“{n}” ይሰረዝ?', 'Delete': 'ሰርዝ', 'used {n} times': '{n} ጊዜ ጥቅም ላይ ውሏል', 'switched off': 'ጠፍቷል', 'built in': 'አብሮ የተሰራ', 'Edit': 'አስተካክል', 'Switch off': 'አጥፋ', 'Switch on': 'አብራ', 'Nothing here yet.': 'ገና ምንም የለም።', 'Cancel': 'ተው', 'Save': 'አስቀምጥ',
  'Phone number': 'ስልክ ቁጥር', 'Another phone number (optional)': 'ሌላ ስልክ ቁጥር (አማራጭ)', 'Add another phone number': 'ሌላ ስልክ ቁጥር ጨምር', 'Remove': 'አስወግድ',
  'This person has no phone (admin allows it)': 'ይህ ሰው ስልክ የለውም (አስተዳዳሪው ፈቅዷል)', '{x}: please enter a phone number.': '{x}፦ እባክዎ ስልክ ቁጥር ይጻፉ።', 'No phone (allowed by admin)': 'ስልክ የለም (አስተዳዳሪው ፈቅዷል)', '{n} have no phone number yet.': '{n} ሰዎች ገና ስልክ ቁጥር የላቸውም።',
  'Sub-city: {x}': 'ክፍለ ከተማ፦ {x}', 'Sub-city not set for this church yet. Ask the administrator to set it in Churches.': 'ለዚህ ቤተ ክርስቲያን ክፍለ ከተማ ገና አልተገለጸም። አስተዳዳሪው በቤተ ክርስቲያናት ገጽ እንዲያስቀምጠው ይጠይቁ።',
  'Which sub-city has the most issues': 'ብዙ ጉዳይ ያለው ክፍለ ከተማ የትኛው ነው', 'by the church of the person who came': 'በመጣው ሰው ቤተ ክርስቲያን መሠረት', 'Churches with the most issues': 'ብዙ ጉዳይ ያላቸው አብያተ ክርስቲያናት', 'Issues': 'ጉዳዮች', 'Cases': 'ጉዳዮች', 'Resolved': 'የተፈቱ', 'What kind of issues': 'ምን ዓይነት ጉዳዮች', 'Church': 'ቤተ ክርስቲያን', 'No cases yet.': 'ገና ጉዳይ የለም።',
}

const CATEGORY_AM = { HR: 'ሰው ሀብት', Finance: 'ፋይናንስ', Management: 'አስተዳደር', Court: 'ፍርድ ቤት', Unclear: 'ገና ግልጽ ያልሆነ' }
const cat = k => CATEGORY_AM[k] || k
/** Department names are typed by the admin; the standard ones have an Amharic name. */
const dn = n => String(n).split(', ').map(x => AM[x] || x).join('፣ ')

/** Sentences with names and numbers. Each returns the Amharic text. */
const PATTERNS = [
  [/^(\d+) issues? resolved$/, m => `${m[1]} ጉዳይ ተፈቷል`],
  [/^(\d+) of (\d+) issues? resolved$/, m => `ከ${m[2]} ጉዳዮች ${m[1]} ተፈቷል`],
  [/^(\d+)\/(\d+) resolved$/, m => `${m[1]}/${m[2]} ተፈቷል`],
  [/^(\d+) issues?$/, m => `${m[1]} ጉዳይ`],
  [/^(\d+) church(?:es)? on the list\. These appear when registering a case\.$/, m => `${m[1]} አብያተ ክርስቲያናት በዝርዝሩ ላይ አሉ። ጉዳይ ሲመዘገብ ይታያሉ።`],
  [/^Page (\d+) of (\d+)$/, m => `ገጽ ${m[1]} ከ${m[2]}`],
  [/^See all (\d+) results →?$/, m => `ሁሉንም ${m[1]} ውጤቶች ይመልከቱ →`],
  [/^No case found for “(.*)”\. Check the spelling or the code\.$/, m => `ለ“${m[1]}” ምንም ጉዳይ አልተገኘም። ፊደሉን ወይም ኮዱን ያረጋግጡ።`],
  [/^No match for “(.*)”\.$/, m => `ለ“${m[1]}” ምንም አልተገኘም።`],
  [/^Notifications, (\d+) unread$/, m => `ማሳወቂያዎች፣ ${m[1]} ያልተነበቡ`],
  [/^group of (\d+)$/, m => `የ${m[1]} ሰዎች ቡድን`],
  [/^About: (.*)$/, m => `ስለ፦ ${m[1]}`],
  [/^about (.*)$/, m => `ስለ ${m[1]}`],
  [/^with (.*)$/, m => `ከ${dn(m[1])} ጋር`],
  [/^(\d+) cases are about this person$/, m => `${m[1]} ጉዳዮች ስለዚህ ሰው ናቸው`],
  [/^In (\d+) cases on record$/, m => `በመዝገብ ላይ በ${m[1]} ጉዳዮች ውስጥ አለ`],
  [/^Returns (.+?)( \(overdue\)| \(today\))?$/, m => `የሚመለሱት ${m[1]}${m[2] ? (m[2].includes('overdue') ? ' (ጊዜው አልፏል)' : ' (ዛሬ)') : ''}`],
  [/^Resolved (.+?)(?: by (.+?))? \(@(.+?)\)(?: — (.*))?$/, m => `ተፈቷል ${m[1]}${m[2] ? ' በ' + dn(m[2].replace(/^ by /, '')) : ''} (@${m[3]})${m[4] ? ' — ' + m[4] : ''}`],
  [/^Resolved (.+?) by @(\S+)(?: — (.*))?$/, m => `ተፈቷል ${m[1]} በ@${m[2]}${m[3] ? ' — ' + m[3] : ''}`],
  [/^In court since (.+?) ·$/, m => `ከ${m[1]} ጀምሮ በፍርድ ቤት ·`],
  [/^acknowledged by @(\S+)$/, m => `በ@${m[1]} ተረጋግጧል`],
  [/^(.*) ★ suggested$/, m => `${m[1]} ★ የሚመከር`],
  [/^Registered (.+?) by @(\S+)$/, m => `የተመዘገበው ${m[1]} በ@${m[2]}`],
  [/^Reported by a group \((\d+)\)$/, m => `በቡድን የቀረበ (${m[1]})`],
  [/^Received (.*)$/, m => `ተቀብሏል ${m[1]}`],
  [/^person returns$/, () => 'ሰውየው የሚመለሱት'],
  [/^(\d+) staff accounts?$/, m => `${m[1]} የሠራተኛ መለያዎች`],
  [/^(.+) · switched off$/, m => `${m[1]} · ጠፍቷል`],
  [/^Waiting \((\d+)\)$/, m => `በመጠባበቅ ላይ (${m[1]})`],
  [/^Unread \((\d+)\)$/, m => `ያልተነበቡ (${m[1]})`],
  [/^(.+) inbox$/, m => `${dn(m[1])} ገቢ ጉዳዮች`],
  [/^Issues sent to (your department|this department)\. Resolving one tells the desk straight away\.$/, m => `ለ${m[1] === 'your department' ? 'መምሪያዎ' : 'ይህ መምሪያ'} የተላኩ ጉዳዮች። አንዱን ሲፈቱ ጠረጴዛው ወዲያውኑ ይነገረዋል።`],
  [/^Issue (\d+)$/, m => `ጉዳይ ${m[1]}`],
  [/^Person (\d+)$/, m => `ሰው ${m[1]}`],
  [/^Person (\d+) it is about$/, m => `ጉዳዩ የሚመለከተው ሰው ${m[1]}`],
  [/^Person (\d+) reporting$/, m => `ጉዳይ የሚያቀርበው ሰው ${m[1]}`],
  [/^(\d+) issues in one case\. Consider noting which one is most urgent\.$/, m => `በአንድ ጉዳይ ውስጥ ${m[1]} ጉዳዮች አሉ። የትኛው በጣም አስቸኳይ እንደሆነ ማስታወሱን ያስቡበት።`],
  [/^(.+) · in (\d+) cases? \((\d+) still active\)$/, m => `${m[1]} · በ${m[2]} ጉዳዮች ውስጥ (${m[3]} አሁንም ንቁ ናቸው)`],
  [/^(\d+) earlier cases? (?:is|are) about this person$/, m => `${m[1]} ቀደምት ጉዳዮች ስለዚህ ሰው ናቸው`],
  [/^(\d+) new cases? this week · (\d+) still being handled\.$/, m => `በዚህ ሳምንት ${m[1]} አዲስ ጉዳዮች · ${m[2]} አሁንም በሂደት ላይ ናቸው።`],
  [/^Welcome! Register the first case to see your reports come alive\.$/, () => 'እንኳን ደህና መጡ! ሪፖርቶችዎ ሕያው ሆነው ለማየት የመጀመሪያውን ጉዳይ ይመዝግቡ።'],
  [/^(\d+) in the last 7 days$/, m => `ባለፉት 7 ቀናት ${m[1]}`],
  [/^(\d+) in court$/, m => `${m[1]} በፍርድ ቤት`],
  [/^(\d+)% resolution rate$/, m => `${m[1]}% የመፍታት መጠን`],
  [/^(\d+) overdue$/, m => `${m[1]} ጊዜው ያለፈባቸው`],
  [/^(\d+) came back$/, m => `${m[1]} ተመልሰዋል`],
  [/^(\d+) waiting · (\d+) resolved$/, m => `${m[1]} በመጠባበቅ ላይ · ${m[2]} ተፈቷል`],
  [/^(.+): (\d+) cases?$/, m => `${m[1]}፦ ${m[2]} ጉዳይ`],
  [/^court issues? waiting for your acknowledgment$/, () => 'የእርስዎን ማረጋገጫ የሚጠብቁ የፍርድ ቤት ጉዳዮች'],
  [/^(\d+) min ago$/, m => `ከ${m[1]} ደቂቃ በፊት`], [/^(\d+) h ago$/, m => `ከ${m[1]} ሰዓት በፊት`], [/^(\d+) d ago$/, m => `ከ${m[1]} ቀን በፊት`], [/^just now$/, () => 'አሁን'],
  [/^(\d+) churches?$/, m => `${m[1]} አብያተ ክርስቲያናት`],
  [/^These files could not be uploaded: (.*)\. Add them again below\.$/, m => `እነዚህ ፋይሎች አልተጫኑም፦ ${m[1]}። ከታች እንደገና ይጨምሩ።`],
  [/^Resolved, but these files were not saved: (.*)$/, m => `ተፈቷል፣ ግን እነዚህ ፋይሎች አልተቀመጡም፦ ${m[1]}`],
  [/^(.+): please choose the church from the list \(start typing its name\)\.$/, m => `${m[1]}፦ እባክዎ ቤተ ክርስቲያኑን ከዝርዝሩ ይምረጡ (ስሙን መጻፍ ይጀምሩ)።`],
  [/^Please choose the church from the list \(start typing its name\)\.$/, () => 'እባክዎ ቤተ ክርስቲያኑን ከዝርዝሩ ይምረጡ (ስሙን መጻፍ ይጀምሩ)።'],
  [/^(.+): please enter the name\.$/, m => `${m[1]}፦ እባክዎ ስሙን ያስገቡ።`],
  [/^Issue (\d+): please describe the cause, or mark it “Not clear yet”\.$/, m => `ጉዳይ ${m[1]}፦ እባክዎ መንስኤውን ይግለጹ ወይም “ገና ግልጽ ያልሆነ” ብለው ምልክት ያድርጉ።`],
  [/^You were added to case (\S+)$/, m => `ወደ ጉዳይ ${m[1]} ተጨምረዋል`],
  [/^Access given to (.+)$/, m => `ለ${m[1]} መዳረሻ ተሰጥቷል`],
  [/^Access removed from (.+)$/, m => `ከ${m[1]} መዳረሻ ተወግዷል`],
  [/^Administrators, people with the “see all cases” privilege, @(.+) \(who registered it\) and the departments it was sent to always have access\. Add anyone else here\.$/, m => `አስተዳዳሪዎች፣ “ሁሉንም ጉዳዮች ማየት” መብት ያላቸው ሰዎች፣ @${m[1]} (የመዘገበው) እና ጉዳዩ የተላከላቸው መምሪያዎች ሁልጊዜ መዳረሻ አላቸው። ሌላ ማንኛውንም ሰው እዚህ ይጨምሩ።`],
  [/^(.+) \(@(\S+)\)$/, m => `${m[1]} (@${m[2]})`],
  [/^@(\S+) · added by @(\S+)$/, m => `@${m[1]} · የጨመረው @${m[2]}`],
  [/^Remove “(.*)”\?$/, m => `“${m[1]}” ይወገድ?`],
  [/^New password for (.*) \(min 6 characters\):$/, m => `ለ${m[1]} አዲስ የይለፍ ቃል (ቢያንስ 6 ቁምፊዎች)፦`],
  // messages written by the server
  [/^New (HR|Finance|Management|Court|Unclear) issue for (.+)$/, m => `ለ${dn(m[2])} አዲስ የ${cat(m[1])} ጉዳይ`],
  [/^Case (\S+) fully resolved$/, m => `ጉዳይ ${m[1]} ሙሉ በሙሉ ተፈቷል`],
  [/^Case (\S+) is in court$/, m => `ጉዳይ ${m[1]} በፍርድ ቤት ነው`],
  [/^Court case (\S+) acknowledged$/, m => `የፍርድ ቤት ጉዳይ ${m[1]} ተረጋግጧል`],
  [/^Acknowledged by (.+)$/, m => `በ${m[1]} ተረጋግጧል`],
  [/^Needs your acknowledgment · (.+)$/, m => `የእርስዎን ማረጋገጫ ይፈልጋል · ${m[1]}`],
  [/^Case (\S+) · (.+?)(?: — (.*))?$/, m => `ጉዳይ ${m[1]} · ${m[2]}${m[3] ? ' — ' + m[3] : ''}`],
  [/^(HR|Finance|Management|Court|Unclear) issue sent to (.+?)(?:\. Person asked to come back on (\d{4}-\d\d-\d\d))?(?:\. ([\s\S]*))?$/, m => `የ${cat(m[1])} ጉዳይ ወደ ${dn(m[2])} ተልኳል${m[3] ? '። ሰውየው በ' + m[3] + ' እንዲመለሱ ተጠይቀዋል' : ''}${m[4] ? '። ' + m[4] : ''}`],
  [/^(HR|Finance|Management|Court|Unclear) issue resolved by (.+?)(?:\. ([\s\S]*))?$/, m => `የ${cat(m[1])} ጉዳይ በ${dn(m[2])} ተፈቷል${m[3] ? '። ' + m[3] : ''}`],
  [/^(HR|Finance|Management|Court|Unclear) issue taken to court(?:\. ([\s\S]*))?$/, m => `የ${cat(m[1])} ጉዳይ ወደ ፍርድ ቤት ተወስዷል${m[2] ? '። ' + m[2] : ''}`],
  [/^Court case acknowledged by (.+)$/, m => `የፍርድ ቤት ጉዳይ በ${m[1]} ተረጋግጧል`],
  [/^File added: (.+?)(?: \(to issue (\d+)\))?$/, m => `ፋይል ተጨምሯል፦ ${m[1]}${m[2] ? ' (ወደ ጉዳይ ' + m[2] + ')' : ''}`],
  [/^File removed: (.+)$/, m => `ፋይል ተወግዷል፦ ${m[1]}`],
  [/^Person added: (.+?) \((also reporting|the case is about them|involved)\)(?:: ([\s\S]*))?$/, m => `ሰው ተጨምሯል፦ ${m[1]} (${{ 'also reporting': 'ጉዳይ አቅራቢ', 'the case is about them': 'ጉዳዩ የሚመለከታቸው', involved: 'የተሳተፈ' }[m[2]]})${m[3] ? '፦ ' + m[3] : ''}`],
  [/^(.+) is not active right now$/, m => `${m[1]} አሁን ንቁ አይደለም`],
  [/^(.+) is already in this case in that role$/, m => `${m[1]} በዚህ ጉዳይ ውስጥ በዚያ ሚና አስቀድሞ አለ`],
  [/^Please choose a church from the list for (.+)$/, m => `ለ${m[1]} እባክዎ ቤተ ክርስቲያን ከዝርዝሩ ይምረጡ`],
]

const STRIP_LEAD = /^[^\p{L}\p{N}“"(]+/u
const STRIP_TRAIL = /[\s→←★⭐]+$/u

/** Translate one piece of text; returns it unchanged when there is no translation. */
export function tr(text) {
  if (getLang() !== 'am' || !text) return text
  const lead = (text.match(/^\s*/) || [''])[0]
  const trail = (text.match(/\s*$/) || [''])[0]
  const body = text.trim()
  if (!/\p{L}/u.test(body)) return text
  const sym = (body.match(STRIP_LEAD) || [''])[0]
  let core = body.slice(sym.length)
  const tail = (core.match(STRIP_TRAIL) || [''])[0]
  if (tail) core = core.slice(0, core.length - tail.length)
  const arrow = /→\s*$/.test(body) ? ' →' : /←\s*$/.test(body) ? '' : ''
  const normalized = core.replace(/\s+/g, ' ')
  let out = AM[normalized]
  if (out === undefined) out = AM[normalized + '…'] // keys that end with an ellipsis
  if (out === undefined) { for (const [re, fn] of PATTERNS) { const m = normalized.match(re); if (m) { out = fn(m); break } } }
  if (out === undefined) {
    const full = body.replace(/\s+/g, ' ')
    out = AM[full]
    if (out === undefined) { for (const [re, fn] of PATTERNS) { const m = full.match(re); if (m) { out = fn(m); break } } }
    if (out !== undefined) return lead + out + trail
    return text
  }
  const leftArrow = /^←/.test(body) && !sym.includes('←') ? '' : ''
  return lead + sym + out + (tail.includes('→') && !out.endsWith('→') ? ' →' : '') + leftArrow + arrow.slice(0, 0) + trail
}

/** For text built in code: t('{n} issues', { n: 3 }). The English text is the key. */
export function t(en, vars) {
  const filled = vars ? en.replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? '')) : en
  return tr(filled)
}

const ATTRS = ['placeholder', 'title', 'aria-label']
const done = new WeakMap() // text node or element -> last text we wrote

function fixText(node) {
  const v = node.nodeValue
  if (done.get(node) === v) return
  const out = tr(v)
  if (out !== v) { done.set(node, out); node.nodeValue = out }
}
function fixAttrs(el) {
  for (const a of ATTRS) {
    const v = el.getAttribute?.(a)
    if (!v) continue
    const key = done.get(el) || {}
    if (key[a] === v) continue
    const out = tr(v)
    if (out !== v) { key[a] = out; done.set(el, key); el.setAttribute(a, out) }
  }
}
function walk(root) {
  if (root.nodeType === 3) return fixText(root)
  if (root.nodeType !== 1) return
  if (root.tagName === 'SCRIPT' || root.tagName === 'STYLE' || root.tagName === 'TEXTAREA' && false) return
  fixAttrs(root)
  for (const c of root.childNodes) walk(c)
}

/** Keeps the page in Amharic as React updates it. Does nothing in English. */
export function startTranslator() {
  if (getLang() !== 'am') return
  document.documentElement.lang = 'am'
  const run = () => walk(document.body)
  new MutationObserver(list => {
    for (const m of list) {
      if (m.type === 'characterData') fixText(m.target)
      else if (m.type === 'attributes') fixAttrs(m.target)
      else m.addedNodes.forEach(walk)
    }
  }).observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ATTRS })
  run()
}
