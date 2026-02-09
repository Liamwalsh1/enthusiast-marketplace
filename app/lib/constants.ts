// Counties of Ireland (Republic) and Northern Ireland, sorted alphabetically
export const IRISH_COUNTIES = [
  // Northern Ireland (6 counties)
  "Antrim",
  "Armagh",
  // Republic of Ireland
  "Carlow",
  "Cavan",
  "Clare",
  "Cork",
  "Derry",
  "Donegal",
  "Down",
  "Dublin",
  "Fermanagh",
  "Galway",
  "Kerry",
  "Kildare",
  "Kilkenny",
  "Laois",
  "Leitrim",
  "Limerick",
  "Longford",
  "Louth",
  "Mayo",
  "Meath",
  "Monaghan",
  "Offaly",
  "Roscommon",
  "Sligo",
  "Tipperary",
  "Tyrone",
  "Waterford",
  "Westmeath",
  "Wexford",
  "Wicklow",
] as const;

export type IrishCounty = (typeof IRISH_COUNTIES)[number];

// Popular car makes for enthusiast/classic car marketplace
export const CAR_MAKES = [
  "Alfa Romeo",
  "Aston Martin",
  "Audi",
  "Bentley",
  "BMW",
  "Chevrolet",
  "Citroën",
  "Datsun",
  "Ferrari",
  "Fiat",
  "Ford",
  "Honda",
  "Jaguar",
  "Lamborghini",
  "Lancia",
  "Land Rover",
  "Lotus",
  "Maserati",
  "Mazda",
  "Mercedes-Benz",
  "MG",
  "Mini",
  "Mitsubishi",
  "Nissan",
  "Opel",
  "Peugeot",
  "Porsche",
  "Renault",
  "Rolls-Royce",
  "Saab",
  "Subaru",
  "Toyota",
  "Triumph",
  "Volkswagen",
  "Volvo",
  "Other",
] as const;

export type CarMake = (typeof CAR_MAKES)[number];

// Popular models by make for enthusiast/classic car marketplace
export const CAR_MODELS_BY_MAKE: Record<string, readonly string[]> = {
  "Alfa Romeo": ["Giulia", "Giulietta", "Spider", "GTV", "156", "147", "Stelvio", "4C", "Montreal", "Other"],
  "Aston Martin": ["DB5", "DB7", "DB9", "DB11", "Vantage", "Vanquish", "DBS", "Rapide", "Other"],
  "Audi": ["A3", "A4", "A5", "A6", "A7", "A8", "Q5", "Q7", "TT", "R8", "RS3", "RS4", "RS6", "S3", "S4", "Quattro", "Other"],
  "Bentley": ["Continental GT", "Continental Flying Spur", "Bentayga", "Mulsanne", "Arnage", "Azure", "Other"],
  "BMW": ["1 Series", "2 Series", "3 Series", "4 Series", "5 Series", "6 Series", "7 Series", "8 Series", "X1", "X3", "X5", "X6", "Z3", "Z4", "M3", "M4", "M5", "M6", "i3", "i8", "2002", "E30", "E36", "E46", "Other"],
  "Chevrolet": ["Camaro", "Corvette", "Chevelle", "Impala", "Bel Air", "Nova", "El Camino", "Blazer", "Suburban", "Other"],
  "Citroën": ["DS", "2CV", "CX", "BX", "XM", "C3", "C4", "C5", "Berlingo", "Other"],
  "Datsun": ["240Z", "260Z", "280Z", "510", "1600", "Fairlady", "Other"],
  "Ferrari": ["250 GTO", "275 GTB", "308", "328", "348", "355", "360", "430", "458", "488", "F40", "F50", "Enzo", "LaFerrari", "Testarossa", "Mondial", "California", "Portofino", "Roma", "SF90", "Other"],
  "Fiat": ["500", "124 Spider", "Panda", "Punto", "Tipo", "Barchetta", "Coupe", "X1/9", "131", "Other"],
  "Ford": ["Mustang", "GT", "Focus", "Fiesta", "Escort", "Capri", "Sierra", "Mondeo", "RS200", "GT40", "Bronco", "F-150", "Thunderbird", "Cortina", "Other"],
  "Honda": ["Civic", "Accord", "S2000", "NSX", "Integra", "Prelude", "CR-X", "Beat", "CR-V", "Jazz", "Other"],
  "Jaguar": ["E-Type", "XK", "XJ", "XJS", "XF", "XE", "F-Type", "F-Pace", "Mark 2", "S-Type", "Other"],
  "Lamborghini": ["Miura", "Countach", "Diablo", "Murcielago", "Gallardo", "Aventador", "Huracan", "Urus", "Espada", "Other"],
  "Lancia": ["Delta", "Stratos", "Fulvia", "037", "Thema", "Beta", "Montecarlo", "Other"],
  "Land Rover": ["Defender", "Range Rover", "Range Rover Sport", "Discovery", "Freelander", "Series I", "Series II", "Series III", "Other"],
  "Lotus": ["Elise", "Exige", "Evora", "Esprit", "Europa", "Elan", "Seven", "Carlton", "Other"],
  "Maserati": ["Ghibli", "Quattroporte", "GranTurismo", "GranCabrio", "Levante", "MC20", "3200 GT", "Bora", "Merak", "Other"],
  "Mazda": ["MX-5", "RX-7", "RX-8", "3", "6", "CX-5", "CX-3", "323", "626", "Cosmo", "Other"],
  "Mercedes-Benz": ["A-Class", "C-Class", "E-Class", "S-Class", "SL", "SLK", "SLS", "AMG GT", "G-Class", "GLE", "GLC", "190E", "300SL", "W123", "W124", "W126", "Other"],
  "MG": ["MGA", "MGB", "MGC", "Midget", "TF", "ZR", "ZS", "ZT", "Other"],
  "Mini": ["Classic Mini", "Cooper", "Cooper S", "Clubman", "Countryman", "John Cooper Works", "Other"],
  "Mitsubishi": ["Lancer", "Lancer Evolution", "Eclipse", "3000GT", "Pajero", "Outlander", "Colt", "Starion", "Other"],
  "Nissan": ["GT-R", "350Z", "370Z", "Skyline", "Silvia", "240SX", "300ZX", "Patrol", "Juke", "Qashqai", "Leaf", "Other"],
  "Opel": ["Corsa", "Astra", "Vectra", "Insignia", "Manta", "Kadett", "GT", "Calibra", "Speedster", "Other"],
  "Peugeot": ["205", "206", "207", "208", "306", "308", "405", "406", "504", "505", "508", "RCZ", "Other"],
  "Porsche": ["911", "912", "914", "924", "928", "944", "968", "959", "Boxster", "Cayman", "Cayenne", "Macan", "Panamera", "Taycan", "918 Spyder", "Carrera GT", "Other"],
  "Renault": ["Clio", "Megane", "Laguna", "Scenic", "5", "Alpine A110", "R4", "R5 Turbo", "Twingo", "Zoe", "Other"],
  "Rolls-Royce": ["Phantom", "Ghost", "Wraith", "Dawn", "Cullinan", "Silver Shadow", "Silver Spirit", "Corniche", "Other"],
  "Saab": ["900", "9000", "9-3", "9-5", "99", "96", "Sonett", "Other"],
  "Subaru": ["Impreza", "WRX", "Legacy", "Outback", "Forester", "BRZ", "SVX", "Other"],
  "Toyota": ["Supra", "Celica", "MR2", "GT86", "GR86", "Corolla", "Camry", "Land Cruiser", "Hilux", "Yaris", "AE86", "2000GT", "Other"],
  "Triumph": ["TR2", "TR3", "TR4", "TR5", "TR6", "TR7", "TR8", "Spitfire", "GT6", "Stag", "Dolomite", "Herald", "Other"],
  "Volkswagen": ["Golf", "Polo", "Passat", "Beetle", "Scirocco", "Corrado", "Karmann Ghia", "Transporter", "Tiguan", "Touareg", "Arteon", "ID.4", "Other"],
  "Volvo": ["240", "740", "850", "940", "S60", "S90", "V60", "V90", "XC40", "XC60", "XC90", "P1800", "Amazon", "C30", "Other"],
  "Other": ["Other"],
};

// ============================================
// WHEEL SPECIFICATIONS
// ============================================

// Common wheel diameters in inches
export const WHEEL_DIAMETERS = [
  "13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "23", "24"
] as const;

export type WheelDiameter = (typeof WHEEL_DIAMETERS)[number];

// Common wheel widths in inches
export const WHEEL_WIDTHS = [
  "5", "5.5", "6", "6.5", "7", "7.5", "8", "8.5", "9", "9.5", "10", "10.5", "11", "11.5", "12", "12.5", "13"
] as const;

export type WheelWidth = (typeof WHEEL_WIDTHS)[number];

// Common bolt patterns (PCD - Pitch Circle Diameter)
export const BOLT_PATTERNS = [
  "3x112",
  "4x98",
  "4x100",
  "4x108",
  "4x114.3",
  "5x100",
  "5x108",
  "5x110",
  "5x112",
  "5x114.3",
  "5x115",
  "5x118",
  "5x120",
  "5x127",
  "5x130",
  "5x139.7",
  "6x114.3",
  "6x127",
  "6x135",
  "6x139.7",
  "Multi-pattern",
  "Other",
] as const;

export type BoltPattern = (typeof BOLT_PATTERNS)[number];

// Popular wheel brands for enthusiast market
export const WHEEL_BRANDS = [
  "Advan",
  "American Racing",
  "BBS",
  "Borbet",
  "Braid",
  "Compomotive",
  "Enkei",
  "Fifteen52",
  "Fuchs",
  "HRE",
  "Konig",
  "Lenso",
  "Minilite",
  "Motegi Racing",
  "OZ Racing",
  "Rays (Volk)",
  "Ronal",
  "Rotiform",
  "SSR",
  "Speedline",
  "TSW",
  "Watanabe",
  "Weds",
  "Work",
  "OEM/Factory",
  "Other",
] as const;

export type WheelBrand = (typeof WHEEL_BRANDS)[number];

// Wheel material types
export const WHEEL_MATERIALS = [
  "Alloy",
  "Steel",
  "Forged",
  "Carbon Fiber",
  "Magnesium",
  "Other",
] as const;

export type WheelMaterial = (typeof WHEEL_MATERIALS)[number];

// Wheel quantity options
export const WHEEL_QUANTITIES = [
  "1",
  "2",
  "3",
  "4",
  "5+",
] as const;

export type WheelQuantity = (typeof WHEEL_QUANTITIES)[number];
