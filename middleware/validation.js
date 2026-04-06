const { z } = require('zod');

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'TheBoss';

function normalizeUsername(username) {
  return username
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\u0400-\u04FF]/g, '')
    .replace(/[\u0370-\u03FF]/g, '')
    .replace(/[\u0400-\u04FF]/g, '')
    .toLowerCase();
}

function isAdminUser(username) {
  const normalized = normalizeUsername(username);
  const adminNormalized = normalizeUsername(ADMIN_USERNAME);
  return (
    normalized === adminNormalized ||
    normalized.includes(ADMIN_USERNAME.toLowerCase()) ||
    username.toLowerCase().includes(ADMIN_USERNAME.toLowerCase())
  );
}

const RESERVED_USERNAMES = [
  'admin',
  'administrator',
  'root',
  'moderator',
  'sysadmin',
  'theboss',
  'superuser',
  'super admin',
  'owner',
  'webmaster',
];

function isReservedUsername(username) {
  const normalized = normalizeUsername(username);
  return RESERVED_USERNAMES.some(
    (reserved) => normalized === reserved || normalized.includes(reserved),
  );
}

const DND_CLASSES = [
  'Barbarian',
  'Bard',
  'Cleric',
  'Druid',
  'Fighter',
  'Monk',
  'Paladin',
  'Ranger',
  'Rogue',
  'Sorcerer',
  'Warlock',
  'Wizard',
];

const DND_RACES = [
  'Dragonborn',
  'Dwarf',
  'Elf',
  'Gnome',
  'Half-Elf',
  'Half-Orc',
  'Halfling',
  'Human',
  'Tiefling',
];

const VALID_LOOKING_FOR = [
  'Romance/RP relationship',
  'Campaign buddies',
  'Friends to chat with',
  'One-shot adventures',
  'Just browsing',
];

const EXPERIENCE_LEVELS = ['Beginner', 'Intermediate', 'Expert'];

const TIMEZONES = [
  'UTC-12 (Baker Island)',
  'UTC-11 (American Samoa)',
  'UTC-10 (Hawaii)',
  'UTC-9 (Alaska)',
  'UTC-8 (Pacific Time)',
  'UTC-7 (Mountain Time)',
  'UTC-6 (Central Time)',
  'UTC-5 (Eastern Time)',
  'UTC-4 (Atlantic Time)',
  'UTC-3 (South America)',
  'UTC-2 (Mid-Atlantic)',
  'UTC-1 (Azores)',
  'UTC+0 (GMT)',
  'UTC+1 (Central Europe)',
  'UTC+2 (Eastern Europe)',
  'UTC+3 (Moscow)',
  'UTC+4 (Dubai)',
  'UTC+5 (Karachi)',
  'UTC+5:30 (India)',
  'UTC+6 (Bangladesh)',
  'UTC+7 (Bangkok)',
  'UTC+8 (China/Singapore)',
  'UTC+9 (Japan/Korea)',
  'UTC+10 (Australia)',
  'UTC+11 (Solomon Islands)',
  'UTC+12 (New Zealand)',
];

const registerSchema = z
  .object({
    name: z
      .string()
      .min(3, 'Username must be at least 3 characters')
      .max(30, 'Username must be 30 characters or less')
      .regex(/^[^\s]+$/, 'Username cannot contain spaces'),
    pass: z.string().min(12, 'Password must be at least 12 characters'),
    pass2: z.string(),
  })
  .refine((data) => data.pass === data.pass2, {
    message: 'Passwords do not match',
    path: ['pass2'],
  });

const loginSchema = z.object({
  name: z.string().min(1, 'Username is required'),
  pass: z.string().min(1, 'Password is required'),
});

const profileSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be 100 characters or less'),
  race: z.string().refine((val) => DND_RACES.includes(val), { message: 'Invalid race' }),
  class: z.string().refine((val) => DND_CLASSES.includes(val), { message: 'Invalid class' }),
  level: z
    .string()
    .transform((val) => Number(val))
    .pipe(z.number().int().min(1).max(100, 'Level must be between 1 and 100')),
  bio: z.string().max(2000, 'Bio must be 2000 characters or less').optional(),
  looking_for: z
    .array(z.string())
    .transform((arr) => arr.filter((v) => VALID_LOOKING_FOR.includes(v)))
    .default([]),
  experience_level: z
    .string()
    .refine((val) => EXPERIENCE_LEVELS.includes(val), { message: 'Invalid experience level' }),
  timezone: z.string().refine((val) => TIMEZONES.includes(val), { message: 'Invalid timezone' }),
  user_type: z.enum(['player', 'dm', 'both']).optional(),
});

const userEditSchema = z.object({
  name: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be 30 characters or less')
    .regex(/^[^\s]+$/, 'Username cannot contain spaces'),
  pass: z.string().min(12, 'Password must be at least 12 characters').optional(),
  userType: z.enum(['player', 'dm', 'both']).optional(),
});

function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const errors = result.error.issues.map((issue) => issue.message).join(', ');
      const isJson = req.accepts('json') && !req.accepts('html');

      if (isJson) {
        return res.status(400).json({ error: errors });
      }
      return res.status(400).render('error', { statusCode: 400, message: errors });
    }

    req.validated = result.data;
    next();
  };
}

function sanitizeLookingFor(input) {
  if (!input) return [];
  const arr = Array.isArray(input) ? input : [input];
  return arr.filter((v) => VALID_LOOKING_FOR.includes(v));
}

module.exports = {
  isAdminUser,
  isReservedUsername,
  DND_CLASSES,
  DND_RACES,
  VALID_LOOKING_FOR,
  EXPERIENCE_LEVELS,
  TIMEZONES,
  registerSchema,
  loginSchema,
  profileSchema,
  userEditSchema,
  validate,
  sanitizeLookingFor,
};
