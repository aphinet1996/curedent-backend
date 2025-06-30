import mongoose, { Schema } from 'mongoose';
import { IPatientDocument, IAddress, IEmergencyContact, IMedicalInfo, IHNCounter } from '../types/patient.types';
import { IMultilingualText, calculateAge } from '../utils/mogoose.utils';

// Schema สำหรับข้อมูลหลายภาษา
const multilingualTextSchema = new Schema<IMultilingualText>({
    th: {
        type: String,
        required: [true, 'กรุณาระบุข้อมูลภาษาไทย'],
        trim: true,
        maxlength: [100, 'ข้อมูลภาษาไทยต้องไม่เกิน 100 ตัวอักษร']
    },
    en: {
        type: String,
        trim: true,
        maxlength: [100, 'ข้อมูลภาษาอังกฤษต้องไม่เกิน 100 ตัวอักษร']
    }
}, { _id: false });

// Schema สำหรับคำนำหน้าชื่อ
const titlePrefixSchema = new Schema<IMultilingualText>({
    th: {
        type: String,
        required: [true, 'กรุณาระบุคำนำหน้าชื่อภาษาไทย'],
        trim: true,
        maxlength: [20, 'คำนำหน้าชื่อต้องไม่เกิน 20 ตัวอักษร']
    },
    en: {
        type: String,
        trim: true,
        maxlength: [20, 'คำนำหน้าชื่อภาษาอังกฤษต้องไม่เกิน 20 ตัวอักษร']
    }
}, { _id: false });

// Schema สำหรับสัญชาติ (แก้ไขเป็น multilingual)
const nationalitySchema = new Schema<IMultilingualText>({
    th: {
        type: String,
        required: [true, 'กรุณาระบุสัญชาติภาษาไทย'],
        trim: true,
        maxlength: [50, 'สัญชาติต้องไม่เกิน 50 ตัวอักษร']
    },
    en: {
        type: String,
        trim: true,
        maxlength: [50, 'สัญชาติภาษาอังกฤษต้องไม่เกิน 50 ตัวอักษร']
    }
}, { _id: false });

// Schema สำหรับเพศ (แก้ไขเป็น multilingual)
const genderSchema = new Schema<IMultilingualText>({
    th: {
        type: String,
        required: [true, 'กรุณาระบุเพศภาษาไทย'],
        trim: true,
        maxlength: [20, 'เพศต้องไม่เกิน 20 ตัวอักษร']
    },
    en: {
        type: String,
        trim: true,
        maxlength: [20, 'เพศภาษาอังกฤษต้องไม่เกิน 20 ตัวอักษร']
    }
}, { _id: false });

// Schema สำหรับประเภทผู้ป่วย (แก้ไขเป็น multilingual)
const patientTypeSchema = new Schema<IMultilingualText>({
    th: {
        type: String,
        required: [true, 'กรุณาระบุประเภทผู้ป่วยภาษาไทย'],
        trim: true,
        maxlength: [50, 'ประเภทผู้ป่วยต้องไม่เกิน 50 ตัวอักษร']
    },
    en: {
        type: String,
        trim: true,
        maxlength: [50, 'ประเภทผู้ป่วยภาษาอังกฤษต้องไม่เกิน 50 ตัวอักษร']
    }
}, { _id: false });

// Schema สำหรับกรุ๊ปเลือด (แก้ไขเป็น multilingual - optional)
const bloodGroupSchema = new Schema<IMultilingualText>({
    th: {
        type: String,
        trim: true,
        maxlength: [10, 'กรุ๊ปเลือดต้องไม่เกิน 10 ตัวอักษร']
    },
    en: {
        type: String,
        trim: true,
        maxlength: [10, 'กรุ๊ปเลือดภาษาอังกฤษต้องไม่เกิน 10 ตัวอักษร']
    }
}, { _id: false });

// Schema สำหรับอาชีพ (แก้ไขเป็น multilingual - optional)
const occupationSchema = new Schema<IMultilingualText>({
    th: {
        type: String,
        trim: true,
        maxlength: [100, 'อาชีพต้องไม่เกิน 100 ตัวอักษร']
    },
    en: {
        type: String,
        trim: true,
        maxlength: [100, 'อาชีพภาษาอังกฤษต้องไม่เกิน 100 ตัวอักษร']
    }
}, { _id: false });

// Schema สำหรับสิทธิการรักษา (แก้ไขเป็น multilingual - optional)
const medicalRightsSchema = new Schema<IMultilingualText>({
    th: {
        type: String,
        trim: true,
        maxlength: [100, 'สิทธิการรักษาต้องไม่เกิน 100 ตัวอักษร']
    },
    en: {
        type: String,
        trim: true,
        maxlength: [100, 'สิทธิการรักษาภาษาอังกฤษต้องไม่เกิน 100 ตัวอักษร']
    }
}, { _id: false });

// Schema สำหรับสถานภาพ (แก้ไขเป็น multilingual - optional)
const maritalStatusSchema = new Schema<IMultilingualText>({
    th: {
        type: String,
        trim: true,
        maxlength: [50, 'สถานภาพต้องไม่เกิน 50 ตัวอักษร']
    },
    en: {
        type: String,
        trim: true,
        maxlength: [50, 'สถานภาพภาษาอังกฤษต้องไม่เกิน 50 ตัวอักษร']
    }
}, { _id: false });

// Schema สำหรับช่องทางที่รู้จัก (แก้ไขเป็น multilingual - optional)
const referralSourceSchema = new Schema<IMultilingualText>({
    th: {
        type: String,
        trim: true,
        maxlength: [100, 'ช่องทางที่รู้จักต้องไม่เกิน 100 ตัวอักษร']
    },
    en: {
        type: String,
        trim: true,
        maxlength: [100, 'ช่องทางที่รู้จักภาษาอังกฤษต้องไม่เกิน 100 ตัวอักษร']
    }
}, { _id: false });

// Schema สำหรับที่อยู่
const addressSchema = new Schema<IAddress>({
    address: {
        type: String,
        required: [true, 'กรุณาระบุที่อยู่'],
        trim: true,
        maxlength: [200, 'ที่อยู่ต้องไม่เกิน 200 ตัวอักษร']
    },
    subdistrict: {
        type: String,
        required: [true, 'กรุณาระบุแขวง/ตำบล'],
        trim: true,
        maxlength: [100, 'แขวง/ตำบลต้องไม่เกิน 100 ตัวอักษร']
    },
    district: {
        type: String,
        required: [true, 'กรุณาระบุเขต/อำเภอ'],
        trim: true,
        maxlength: [100, 'เขต/อำเภอต้องไม่เกิน 100 ตัวอักษร']
    },
    province: {
        type: String,
        required: [true, 'กรุณาระบุจังหวัด'],
        trim: true,
        maxlength: [100, 'จังหวัดต้องไม่เกิน 100 ตัวอักษร']
    },
    zipcode: {
        type: String,
        required: [true, 'กรุณาระบุรหัสไปรษณีย์'],
        trim: true,
        validate: {
            validator: function (v: string) {
                return /^[0-9]{5}$/.test(v);
            },
            message: 'รหัสไปรษณีย์ต้องเป็นตัวเลข 5 หลัก'
        }
    }
}, { _id: false });

// Schema สำหรับบุคคลที่ติดต่อกรณีฉุกเฉิน
const emergencyContactSchema = new Schema<IEmergencyContact>({
    fullName: {
        type: String,
        required: [true, 'กรุณาระบุชื่อ-นามสกุลผู้ติดต่อฉุกเฉิน'],
        trim: true,
        maxlength: [200, 'ชื่อ-นามสกุลต้องไม่เกิน 200 ตัวอักษร']
    },
    relationship: {
        type: String,
        required: [true, 'กรุณาระบุความสัมพันธ์'],
        trim: true,
        maxlength: [50, 'ความสัมพันธ์ต้องไม่เกิน 50 ตัวอักษร']
    },
    address: {
        type: String,
        required: [true, 'กรุณาระบุที่อยู่ผู้ติดต่อฉุกเฉิน'],
        trim: true,
        maxlength: [500, 'ที่อยู่ต้องไม่เกิน 500 ตัวอักษร']
    },
    phone: {
        type: String,
        required: [true, 'กรุณาระบุเบอร์โทรศัพท์ผู้ติดต่อฉุกเฉิน'],
        trim: true,
        maxlength: [20, 'เบอร์โทรศัพท์ต้องไม่เกิน 20 ตัวอักษร']
    }
}, { _id: false });

// Schema สำหรับข้อมูลจำเพาะทางการแพทย์
const medicalInfoSchema = new Schema<IMedicalInfo>({
    drugAllergies: [{
        type: String,
        trim: true,
        maxlength: [200, 'รายการแพ้ยาแต่ละรายการต้องไม่เกิน 200 ตัวอักษร']
    }],
    primaryDoctorId: {
        type: Schema.Types.ObjectId,
        ref: 'Doctor',
        validate: {
            validator: async function (v: string) {
                if (!v) return true; 
                const doctor = await mongoose.model('Doctor').findById(v);
                return doctor !== null;
            },
            message: 'แพทย์ประจำที่ระบุไม่ถูกต้อง'
        }
    },
    assistantDoctorId: {
        type: Schema.Types.ObjectId,
        ref: 'Assistant',
        validate: {
            validator: async function (v: string) {
                if (!v) return true; 
                const doctor = await mongoose.model('Assistant').findById(v);
                return doctor !== null;
            },
            message: 'ผู้ช่วยแพทย์ที่ระบุไม่ถูกต้อง'
        }
    },
    chronicDiseases: [{
        type: String,
        trim: true,
        maxlength: [200, 'รายการโรคประจำตัวแต่ละรายการต้องไม่เกิน 200 ตัวอักษร']
    }],
    currentMedications: [{
        type: String,
        trim: true,
        maxlength: [200, 'รายการยาแต่ละรายการต้องไม่เกิน 200 ตัวอักษร']
    }]
}, { _id: false });

// Schema สำหรับ HN Counter
const hnCounterSchema = new Schema<IHNCounter>({
    date: {
        type: String,
        required: true,
        unique: true,
        validate: {
            validator: function (v: string) {
                return /^[0-9]{6}$/.test(v); // YYMMDD format
            },
            message: 'รูปแบบวันที่ไม่ถูกต้อง (YYMMDD)'
        }
    },
    sequence: {
        type: Number,
        required: true,
        default: 0,
        min: 0,
        max: 999
    },
    clinicId: {
        type: Schema.Types.ObjectId,
        ref: 'Clinic',
        required: true
    }
});

// Compound index สำหรับ HN Counter
hnCounterSchema.index({ date: 1, clinicId: 1 }, { unique: true });

// Schema หลักสำหรับ Patient
const patientSchema = new Schema<IPatientDocument>(
    {
        // ข้อมูลระบบ
        branchId: {
            type: Schema.Types.ObjectId,
            ref: 'Branch',
            required: [true, 'กรุณาระบุสาขา']
        },
        clinicId: {
            type: Schema.Types.ObjectId,
            ref: 'Clinic',
            required: [true, 'กรุณาระบุคลินิก']
        },
        hn: {
            type: String,
            required: [true, 'กรุณาระบุ HN'],
            // unique: true,
            trim: true,
            uppercase: true,
            validate: {
                validator: function (v: string) {
                    return /^HN[0-9]{6}[0-9]{3}$/.test(v); // HNYYMMDD000 format
                },
                message: 'รูปแบบ HN ไม่ถูกต้อง (HNYYMMDD000)'
            }
        },

        // ข้อมูลทั่วไป
        nationalId: {
            type: String,
            required: [true, 'กรุณาระบุเลขบัตรประชาชน'],
            // unique: true,
            trim: true,
            validate: {
                validator: function (v: string) {
                    return /^[0-9]{13}$/.test(v);
                },
                message: 'เลขบัตรประชาชนต้องเป็นตัวเลข 13 หลัก'
            }
        },

        // ข้อมูลหลายภาษา (แก้ไขเป็น multilingual)
        nationality: {
            type: nationalitySchema,
            required: [true, 'กรุณาระบุสัญชาติ']
        },
        titlePrefix: {
            type: titlePrefixSchema,
            required: [true, 'กรุณาระบุคำนำหน้าชื่อ']
        },
        firstName: {
            type: multilingualTextSchema,
            required: [true, 'กรุณาระบุชื่อจริง']
        },
        lastName: {
            type: multilingualTextSchema,
            required: [true, 'กรุณาระบุนามสกุล']
        },
        gender: {
            type: genderSchema,
            required: [true, 'กรุณาระบุเพศ']
        },
        patientType: {
            type: patientTypeSchema,
            required: [true, 'กรุณาระบุประเภทผู้ป่วย']
        },

        // ข้อมูลเสริม (optional) - แก้ไขเป็น multilingual
        nickname: {
            type: String,
            trim: true,
            maxlength: [50, 'ชื่อเล่นต้องไม่เกิน 50 ตัวอักษร']
        },
        dateOfBirth: {
            type: Date,
            required: [true, 'กรุณาระบุวันเกิด'],
            validate: {
                validator: function (v: Date) {
                    return v <= new Date(); // ไม่ให้วันเกิดเป็นอนาคต
                },
                message: 'วันเกิดต้องไม่เป็นวันที่ในอนาคต'
            }
        },
        bloodGroup: {
            type: bloodGroupSchema,
        },
        occupation: {
            type: occupationSchema,
        },
        medicalRights: {
            type: medicalRightsSchema,
        },
        maritalStatus: {
            type: maritalStatusSchema,
        },
        referralSource: {
            type: referralSourceSchema,
        },

        // ที่อยู่
        idCardAddress: {
            type: addressSchema,
            required: [true, 'กรุณาระบุที่อยู่ตามบัตรประชาชน']
        },
        currentAddress: {
            type: addressSchema,
            required: [true, 'กรุณาระบุที่อยู่ปัจจุบัน']
        },

        // ข้อมูลการติดต่อ
        phone: {
            type: String,
            required: [true, 'กรุณาระบุเบอร์โทรศัพท์'],
            trim: true,
            maxlength: [20, 'เบอร์โทรศัพท์ต้องไม่เกิน 20 ตัวอักษร']
        },
        email: {
            type: String,
            trim: true,
            lowercase: true,
            validate: {
                validator: function (v: string) {
                    if (!v) return true; // Optional field
                    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
                },
                message: 'รูปแบบอีเมลไม่ถูกต้อง'
            }
        },
        notes: {
            type: String,
            trim: true,
            maxlength: [1000, 'หมายเหตุต้องไม่เกิน 1000 ตัวอักษร']
        },

        // ข้อมูลจำเพาะทางการแพทย์
        medicalInfo: {
            type: medicalInfoSchema,
            required: true,
            default: () => ({
                drugAllergies: [],
                chronicDiseases: [],
                currentMedications: []
            })
        },

        // บุคคลที่ติดต่อกรณีฉุกเฉิน
        emergencyContact: {
            type: emergencyContactSchema,
            required: [true, 'กรุณาระบุข้อมูลผู้ติดต่อฉุกเฉิน']
        },

        // สถานะ
        isActive: {
            type: Boolean,
            default: true
        }
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// Indexes
patientSchema.index({ hn: 1 }, { unique: true });
patientSchema.index({ nationalId: 1 }, { unique: true });
patientSchema.index({ branchId: 1 });
patientSchema.index({ clinicId: 1 });
patientSchema.index({ 'firstName.th': 1, 'lastName.th': 1 });
patientSchema.index({ 'firstName.en': 1, 'lastName.en': 1 });
patientSchema.index({ phone: 1 });
patientSchema.index({ isActive: 1 });
patientSchema.index({ createdAt: -1 });

// Text search index - อัปเดตให้รวม fields ที่เป็น multilingual
patientSchema.index({
    'titlePrefix.th': 'text',
    'titlePrefix.en': 'text',
    'firstName.th': 'text',
    'lastName.th': 'text',
    'firstName.en': 'text',
    'lastName.en': 'text',
    nickname: 'text',
    hn: 'text',
    nationalId: 'text',
    phone: 'text',
    'nationality.th': 'text',
    'nationality.en': 'text',
    'gender.th': 'text',
    'gender.en': 'text',
    'patientType.th': 'text',
    'patientType.en': 'text'
});

// Virtual fields
patientSchema.virtual('fullNameTh').get(function () {
    return `${this.titlePrefix.th}${this.firstName.th} ${this.lastName.th}`.trim();
});

patientSchema.virtual('fullNameEn').get(function () {
    if (this.firstName.en && this.lastName.en) {
        const prefix = this.titlePrefix.en ? `${this.titlePrefix.en} ` : '';
        return `${prefix}${this.firstName.en} ${this.lastName.en}`.trim();
    }
    return '';
});

patientSchema.virtual('age').get(function () {
    return calculateAge(this.dateOfBirth);
});

// Instance Methods
patientSchema.methods.calculateAge = function (): number {
    return calculateAge(this.dateOfBirth);
};

patientSchema.methods.getFullNameTh = function (): string {
    return `${this.titlePrefix.th}${this.firstName.th} ${this.lastName.th}`.trim();
};

patientSchema.methods.getFullNameEn = function (): string {
    if (this.firstName.en && this.lastName.en) {
        const prefix = this.titlePrefix.en ? `${this.titlePrefix.en} ` : '';
        return `${prefix}${this.firstName.en} ${this.lastName.en}`.trim();
    }
    return '';
};

patientSchema.methods.getDisplayName = function (lang = 'th'): string {
    if (lang === 'en' && this.firstName.en && this.lastName.en) {
        return this.getFullNameEn();
    }
    return this.getFullNameTh();
};

// Static Methods
patientSchema.statics.findByBranch = function (branchId: string) {
    return this.find({ branchId, isActive: true })
        .populate('branchId', 'name')
        .populate('medicalInfo.assistantDoctorId', 'firstNameTh lastNameTh')
        .populate('medicalInfo.primaryDoctorId', 'firstNameTh lastNameTh')
        .sort({ createdAt: -1 });
};

patientSchema.statics.findByClinic = function (clinicId: string) {
    return this.find({ clinicId, isActive: true })
        .populate('branchId', 'name')
        .populate('medicalInfo.assistantDoctorId', 'firstNameTh lastNameTh')
        .populate('medicalInfo.primaryDoctorId', 'firstNameTh lastNameTh')
        .sort({ createdAt: -1 });
};

patientSchema.statics.searchPatients = function (searchTerm: string, clinicId?: string) {
    const filter: any = { isActive: true };

    if (clinicId) {
        filter.clinicId = clinicId;
    }

    if (searchTerm) {
        filter.$text = { $search: searchTerm };
    }

    return this.find(filter)
        .populate('branchId', 'name')
        .populate('medicalInfo.assistantDoctorId', 'firstNameTh lastNameTh')
        .populate('medicalInfo.primaryDoctorId', 'firstNameTh lastNameTh')
        .sort({ score: { $meta: 'textScore' }, createdAt: -1 });
};

// Function สำหรับสร้าง HN
async function generateHN(clinicId: string): Promise<string> {
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2); // YY
    const month = (now.getMonth() + 1).toString().padStart(2, '0'); // MM
    const day = now.getDate().toString().padStart(2, '0'); // DD
    const dateStr = `${year}${month}${day}`;

    // ใช้ findOneAndUpdate with upsert เพื่อป้องกัน race condition
    const HNCounter = mongoose.model('HNCounter');
    const counter = await HNCounter.findOneAndUpdate(
        { date: dateStr, clinicId },
        { $inc: { sequence: 1 } },
        { new: true, upsert: true }
    );

    // ตรวจสอบว่า sequence ไม่เกิน 999
    if (counter.sequence > 999) {
        throw new Error('เกินจำนวนผู้ป่วยสูงสุดต่อวัน (999 คน)');
    }

    const sequence = counter.sequence.toString().padStart(3, '0');
    return `HN${dateStr}${sequence}`;
}

// Pre-save middleware สำหรับ auto-generate HN
patientSchema.pre('save', async function (next) {
    try {
        // Generate HN ถ้ายังไม่มี
        if (!this.hn && this.isNew) {
            this.hn = await generateHN(this.clinicId.toString());
        }

        // ตั้งค่า clinicId จาก branchId ถ้ายังไม่มี
        if (!this.clinicId && this.branchId) {
            const Branch = mongoose.model('Branch');
            const branch = await Branch.findById(this.branchId);
            if (branch) {
                this.clinicId = branch.clinicId;
            }
        }

        next();
    } catch (error) {
        next(error as Error);
    }
});

// Pre-save middleware สำหรับ validation
patientSchema.pre('save', async function (next) {
    try {
        // ตรวจสอบว่า branch อยู่ในคลินิกเดียวกันหรือไม่
        if (this.branchId && this.clinicId) {
            const Branch = mongoose.model('Branch');
            const branch = await Branch.findById(this.branchId);
            if (!branch || branch.clinicId.toString() !== this.clinicId.toString()) {
                throw new Error('สาขาที่ระบุไม่อยู่ในคลินิกนี้');
            }
        }

        next();
    } catch (error) {
        next(error as Error);
    }
});

// Post-save middleware
patientSchema.post('save', function (doc) {
    console.log(`Patient ${doc.hn} (${doc.getFullNameTh()}) saved successfully`);
});

// Create models
const HNCounter = mongoose.model<IHNCounter>('HNCounter', hnCounterSchema);
const Patient = mongoose.model<IPatientDocument>('Patient', patientSchema);

export { Patient, HNCounter };
export default Patient;