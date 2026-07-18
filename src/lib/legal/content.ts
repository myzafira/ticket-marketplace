export type LegalSection = {
  heading: string;
  body: string[];
};

export type LegalDoc = {
  title: string;
  updated: string;
  intro: string;
  sections: LegalSection[];
};

export const legalContent: Record<"en" | "th", { terms: LegalDoc; privacy: LegalDoc }> = {
  en: {
    terms: {
      title: "Terms of Service",
      updated: "Last updated: July 2026",
      intro:
        "These Terms govern your use of TicketRight, a marketplace for buying and reselling event tickets. By creating an account or using the service, you agree to these Terms.",
      sections: [
        {
          heading: "1. What TicketRight is",
          body: [
            "TicketRight connects buyers and sellers of event tickets. We are not the event organizer, and we are not a party to the ticket itself.",
            "Payment and ticket handover currently happen directly between the buyer and seller. TicketRight records the transaction, calculates platform fees, and provides trust and dispute tools, but does not hold or process funds on your behalf.",
          ],
        },
        {
          heading: "2. Your account",
          body: [
            "You must provide accurate name, email, phone number, and address, and verify your email before listing, messaging, or buying.",
            "You are responsible for all activity under your account and for keeping your password secure. One account per person.",
          ],
        },
        {
          heading: "3. Listing tickets",
          body: [
            "You may only list tickets you genuinely hold and intend to sell. Listing details (event, date, venue, price, face value) must be accurate.",
            "To prevent scalping, resale price is capped as a percentage of the ticket's face value, set in platform settings and enforced automatically. Sellers who repeatedly receive unfair-price reports may have their listing privileges restricted.",
          ],
        },
        {
          heading: "4. Buying tickets",
          body: [
            "The price shown on a listing is what you agree to pay the seller, before any platform fee deducted from the seller's payout.",
            "After a purchase, sellers are expected to upload proof of the ticket. If you don't receive a valid ticket, you can file an order report for an admin to review.",
          ],
        },
        {
          heading: "5. Fees and loyalty points",
          body: [
            "A platform fee is deducted from the seller's payout, tiered by order size. Verified sellers with a strong completed-sales history may qualify for a reduced fee. Current rates are published on the platform.",
            "Buyers and sellers earn loyalty points on completed orders, redeemable only toward a seller's future platform fee. Points have no cash value and may be reversed in cases of fraud or reversed orders.",
          ],
        },
        {
          heading: "6. Reports, disputes, and restrictions",
          body: [
            "You can report a listing you believe is priced unfairly, or an order that had a problem (ticket not received, invalid ticket, payment issue). Reports are reviewed by admins, who may resolve them, contact either party, or restrict a seller's listing privileges after repeated substantiated complaints.",
          ],
        },
        {
          heading: "7. Prohibited conduct",
          body: [
            "Listing tickets you don't hold, misrepresenting ticket details, circumventing the price cap, posting contact information in listings to route around the platform, harassment, and fraud are all prohibited and may result in account restriction.",
          ],
        },
        {
          heading: "8. Disclaimers",
          body: [
            "TicketRight facilitates connections between buyers and sellers but does not guarantee ticket authenticity, event occurrence, or the outcome of any payment arranged directly between users. Use the reporting tools if something goes wrong, and use good judgment when arranging payment with another user.",
          ],
        },
        {
          heading: "9. Changes to these Terms",
          body: [
            "We may update these Terms from time to time. Continued use of the platform after a change means you accept the updated Terms.",
          ],
        },
        {
          heading: "10. Governing law",
          body: ["These Terms are governed by the laws of Thailand."],
        },
        {
          heading: "11. Contact",
          body: [
            "Questions about these Terms can be sent through the contact details listed in the site footer.",
          ],
        },
      ],
    },
    privacy: {
      title: "Privacy Policy",
      updated: "Last updated: July 2026",
      intro:
        "This Privacy Policy explains what information TicketRight collects, why, and how it's used.",
      sections: [
        {
          heading: "1. Information we collect",
          body: [
            "Account information: name, email, password (stored as a secure hash, never in plain text), phone number, and address.",
            "Activity information: listings, buy requests, orders, messages between users, reviews, reports you file, and any images you upload (listing photos, ticket proof).",
          ],
        },
        {
          heading: "2. Why we collect it",
          body: [
            "To create and secure your account, verify your email, let admins manually confirm your identity when relevant, calculate fees and loyalty points, enable communication between matched buyers and sellers, prevent fraud, and resolve reports and disputes.",
          ],
        },
        {
          heading: "3. What other users can see",
          body: [
            "Other users see a public handle or nickname, your verification badge and completed-sales history, and listing/review content you post. Your real name, email, and phone number are only shared with the specific buyer or seller you're transacting with, so the sale can be completed.",
          ],
        },
        {
          heading: "4. Data retention",
          body: [
            "We keep account and transaction records for as long as your account is active and as needed to resolve disputes, maintain financial records, and meet legal obligations.",
          ],
        },
        {
          heading: "5. Security",
          body: [
            "Passwords are hashed, not stored in plain text. Access to personal information is limited to what's needed to operate the platform, and admin-only data (like full contact details across all users) is restricted to accounts on the platform's admin list.",
          ],
        },
        {
          heading: "6. Cookies and local storage",
          body: [
            "We use a session cookie to keep you signed in, and your browser's local storage to remember your language preference. We don't use third-party advertising trackers.",
          ],
        },
        {
          heading: "7. Your rights",
          body: [
            "You can review and update most of your information from your account page. To request a copy, correction, or deletion of your data, contact us through the details in the site footer.",
          ],
        },
        {
          heading: "8. Children's privacy",
          body: [
            "TicketRight is not intended for individuals under 18. We do not knowingly collect information from minors.",
          ],
        },
        {
          heading: "9. Changes to this policy",
          body: [
            "We may update this Privacy Policy from time to time. Continued use of the platform after a change means you accept the updated policy.",
          ],
        },
        {
          heading: "10. Contact",
          body: [
            "Questions about this Privacy Policy can be sent through the contact details listed in the site footer.",
          ],
        },
      ],
    },
  },
  th: {
    terms: {
      title: "ข้อกำหนดการให้บริการ",
      updated: "อัปเดตล่าสุด: กรกฎาคม 2569",
      intro:
        "ข้อกำหนดนี้ใช้กับการใช้งาน TicketRight ซึ่งเป็นแพลตฟอร์มตลาดกลางสำหรับซื้อขายตั๋วงานอีเวนต์ การสมัครสมาชิกหรือใช้งานบริการถือว่าคุณยอมรับข้อกำหนดนี้",
      sections: [
        {
          heading: "1. TicketRight คืออะไร",
          body: [
            "TicketRight เป็นตัวกลางเชื่อมต่อผู้ซื้อและผู้ขายตั๋วงานอีเวนต์ เราไม่ใช่ผู้จัดงานและไม่ใช่คู่สัญญาของตั๋วนั้นๆ",
            "ปัจจุบันการชำระเงินและการส่งมอบตั๋วเกิดขึ้นโดยตรงระหว่างผู้ซื้อและผู้ขาย TicketRight บันทึกรายการซื้อขาย คำนวณค่าธรรมเนียมแพลตฟอร์ม และมีเครื่องมือด้านความน่าเชื่อถือและการแจ้งปัญหาให้ แต่ไม่ได้ถือหรือดำเนินการเงินแทนคุณ",
          ],
        },
        {
          heading: "2. บัญชีของคุณ",
          body: [
            "คุณต้องให้ข้อมูลชื่อ อีเมล เบอร์โทร และที่อยู่ที่ถูกต้อง และยืนยันอีเมลก่อนลงขาย ส่งข้อความ หรือซื้อสินค้า",
            "คุณต้องรับผิดชอบกิจกรรมทั้งหมดภายใต้บัญชีของคุณและรักษารหัสผ่านให้ปลอดภัย หนึ่งคนใช้ได้หนึ่งบัญชีเท่านั้น",
          ],
        },
        {
          heading: "3. การลงขายตั๋ว",
          body: [
            "คุณสามารถลงขายได้เฉพาะตั๋วที่คุณถืออยู่จริงและตั้งใจจะขายเท่านั้น รายละเอียดการลงขาย (งาน วันที่ สถานที่ ราคา ราคาหน้าตั๋ว) ต้องถูกต้องตามจริง",
            "เพื่อป้องกันการเก็งกำไรราคา ราคาขายต่อถูกจำกัดเป็นเปอร์เซ็นต์ของราคาหน้าตั๋ว ซึ่งกำหนดไว้ในการตั้งค่าแพลตฟอร์มและบังคับใช้โดยอัตโนมัติ ผู้ขายที่ถูกร้องเรียนเรื่องราคาซ้ำหลายครั้งอาจถูกจำกัดสิทธิ์การลงขาย",
          ],
        },
        {
          heading: "4. การซื้อตั๋ว",
          body: [
            "ราคาที่แสดงในประกาศคือราคาที่คุณตกลงจ่ายให้ผู้ขาย ก่อนหักค่าธรรมเนียมแพลตฟอร์มจากยอดที่ผู้ขายได้รับ",
            "หลังการซื้อ ผู้ขายควรอัปโหลดหลักฐานตั๋ว หากคุณไม่ได้รับตั๋วที่ถูกต้อง คุณสามารถแจ้งปัญหาคำสั่งซื้อให้แอดมินตรวจสอบได้",
          ],
        },
        {
          heading: "5. ค่าธรรมเนียมและแต้มสะสม",
          body: [
            "ค่าธรรมเนียมแพลตฟอร์มจะถูกหักจากยอดที่ผู้ขายได้รับ แบ่งเป็นระดับตามมูลค่าคำสั่งซื้อ ผู้ขายที่ยืนยันตัวตนแล้วและมีประวัติขายสำเร็จมากอาจได้รับส่วนลดค่าธรรมเนียม อัตราปัจจุบันเผยแพร่อยู่บนแพลตฟอร์ม",
            "ผู้ซื้อและผู้ขายจะได้รับแต้มสะสมจากคำสั่งซื้อที่สำเร็จ ใช้ได้เฉพาะหักค่าธรรมเนียมของผู้ขายในการขายครั้งถัดไปเท่านั้น แต้มไม่มีมูลค่าเป็นเงินสดและอาจถูกเรียกคืนในกรณีทุจริตหรือคำสั่งซื้อถูกยกเลิก",
          ],
        },
        {
          heading: "6. การแจ้งปัญหา ข้อพิพาท และการจำกัดสิทธิ์",
          body: [
            "คุณสามารถแจ้งประกาศที่คิดว่าตั้งราคาไม่เป็นธรรม หรือแจ้งปัญหาคำสั่งซื้อ (ไม่ได้รับตั๋ว ตั๋วไม่ถูกต้อง ปัญหาการชำระเงิน) ได้ แอดมินจะตรวจสอบเรื่องที่แจ้ง อาจปิดเคส ติดต่อคู่กรณี หรือจำกัดสิทธิ์การลงขายของผู้ขายที่ถูกร้องเรียนซ้ำและมีมูลความจริง",
          ],
        },
        {
          heading: "7. ข้อห้าม",
          body: [
            "ห้ามลงขายตั๋วที่คุณไม่ได้ถืออยู่จริง ให้ข้อมูลเท็จ หลีกเลี่ยงเพดานราคา ใส่ข้อมูลติดต่อในประกาศเพื่อหลบเลี่ยงระบบ คุกคามผู้อื่น หรือกระทำการทุจริต การฝ่าฝืนอาจนำไปสู่การจำกัดบัญชี",
          ],
        },
        {
          heading: "8. ข้อจำกัดความรับผิด",
          body: [
            "TicketRight เป็นตัวกลางเชื่อมต่อผู้ซื้อและผู้ขาย แต่ไม่รับประกันความแท้จริงของตั๋ว การจัดงานจริง หรือผลของการชำระเงินที่ตกลงกันโดยตรงระหว่างผู้ใช้ หากมีปัญหา ให้ใช้เครื่องมือแจ้งปัญหาของเรา และใช้วิจารณญาณเมื่อตกลงเรื่องการชำระเงินกับผู้ใช้อื่น",
          ],
        },
        {
          heading: "9. การเปลี่ยนแปลงข้อกำหนด",
          body: [
            "เราอาจปรับปรุงข้อกำหนดนี้เป็นครั้งคราว การใช้งานแพลตฟอร์มต่อหลังมีการเปลี่ยนแปลงถือว่าคุณยอมรับข้อกำหนดฉบับใหม่",
          ],
        },
        {
          heading: "10. กฎหมายที่ใช้บังคับ",
          body: ["ข้อกำหนดนี้อยู่ภายใต้กฎหมายของประเทศไทย"],
        },
        {
          heading: "11. ติดต่อเรา",
          body: ["หากมีคำถามเกี่ยวกับข้อกำหนดนี้ สามารถติดต่อผ่านช่องทางที่ระบุไว้ที่ท้ายเว็บไซต์"],
        },
      ],
    },
    privacy: {
      title: "นโยบายความเป็นส่วนตัว",
      updated: "อัปเดตล่าสุด: กรกฎาคม 2569",
      intro: "นโยบายนี้อธิบายว่า TicketRight เก็บข้อมูลอะไรบ้าง เพื่ออะไร และใช้งานอย่างไร",
      sections: [
        {
          heading: "1. ข้อมูลที่เราเก็บ",
          body: [
            "ข้อมูลบัญชี: ชื่อ อีเมล รหัสผ่าน (เก็บแบบเข้ารหัสที่ปลอดภัย ไม่ใช่ข้อความธรรมดา) เบอร์โทร และที่อยู่",
            "ข้อมูลกิจกรรม: ประกาศขาย คำขอซื้อ คำสั่งซื้อ ข้อความระหว่างผู้ใช้ รีวิว เรื่องที่คุณแจ้ง และรูปภาพที่คุณอัปโหลด (รูปประกาศ หลักฐานตั๋ว)",
          ],
        },
        {
          heading: "2. เราเก็บข้อมูลไปเพื่ออะไร",
          body: [
            "เพื่อสร้างและรักษาความปลอดภัยบัญชีของคุณ ยืนยันอีเมล ให้แอดมินยืนยันตัวตนด้วยตนเองเมื่อจำเป็น คำนวณค่าธรรมเนียมและแต้มสะสม เปิดให้ผู้ซื้อผู้ขายที่จับคู่กันสื่อสารกันได้ ป้องกันการทุจริต และจัดการเรื่องแจ้งปัญหา/ข้อพิพาท",
          ],
        },
        {
          heading: "3. ผู้ใช้คนอื่นเห็นอะไรบ้าง",
          body: [
            "ผู้ใช้คนอื่นจะเห็นชื่อเล่นสาธารณะ เครื่องหมายยืนยันตัวตน และประวัติการขายสำเร็จ รวมถึงเนื้อหาประกาศ/รีวิวที่คุณโพสต์ ชื่อจริง อีเมล และเบอร์โทรของคุณจะถูกแชร์เฉพาะกับผู้ซื้อหรือผู้ขายที่คุณกำลังทำธุรกรรมด้วยเท่านั้น เพื่อให้การซื้อขายเสร็จสมบูรณ์",
          ],
        },
        {
          heading: "4. ระยะเวลาเก็บข้อมูล",
          body: [
            "เราเก็บข้อมูลบัญชีและธุรกรรมไว้ตราบเท่าที่บัญชีของคุณยังใช้งานอยู่ และตามความจำเป็นในการจัดการข้อพิพาท รักษาบันทึกทางการเงิน และปฏิบัติตามข้อกำหนดทางกฎหมาย",
          ],
        },
        {
          heading: "5. ความปลอดภัย",
          body: [
            "รหัสผ่านถูกเข้ารหัสแบบ hash ไม่เก็บเป็นข้อความธรรมดา การเข้าถึงข้อมูลส่วนบุคคลจำกัดเฉพาะเท่าที่จำเป็นต่อการให้บริการ และข้อมูลระดับแอดมิน (เช่น ข้อมูลติดต่อผู้ใช้ทั้งหมด) จำกัดเฉพาะบัญชีที่อยู่ในรายชื่อแอดมินของแพลตฟอร์มเท่านั้น",
          ],
        },
        {
          heading: "6. คุกกี้และ local storage",
          body: [
            "เราใช้คุกกี้เซสชันเพื่อให้คุณล็อกอินค้างไว้ และ local storage ของเบราว์เซอร์เพื่อจดจำภาษาที่คุณเลือก เราไม่ใช้ตัวติดตามโฆษณาจากบุคคลที่สาม",
          ],
        },
        {
          heading: "7. สิทธิ์ของคุณ",
          body: [
            "คุณสามารถตรวจสอบและแก้ไขข้อมูลส่วนใหญ่ได้จากหน้าบัญชีของคุณ หากต้องการขอสำเนา แก้ไข หรือลบข้อมูล ติดต่อเราผ่านช่องทางที่ระบุไว้ที่ท้ายเว็บไซต์",
          ],
        },
        {
          heading: "8. ความเป็นส่วนตัวของเด็ก",
          body: ["TicketRight ไม่ได้มีไว้สำหรับผู้ที่อายุต่ำกว่า 18 ปี เราไม่เก็บข้อมูลจากผู้เยาว์โดยเจตนา"],
        },
        {
          heading: "9. การเปลี่ยนแปลงนโยบาย",
          body: [
            "เราอาจปรับปรุงนโยบายนี้เป็นครั้งคราว การใช้งานแพลตฟอร์มต่อหลังมีการเปลี่ยนแปลงถือว่าคุณยอมรับนโยบายฉบับใหม่",
          ],
        },
        {
          heading: "10. ติดต่อเรา",
          body: ["หากมีคำถามเกี่ยวกับนโยบายนี้ สามารถติดต่อผ่านช่องทางที่ระบุไว้ที่ท้ายเว็บไซต์"],
        },
      ],
    },
  },
};
