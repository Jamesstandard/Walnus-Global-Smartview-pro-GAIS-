import { RAGKnowledgeDocument } from '../types';

export const RAG_KNOWLEDGE_DOCUMENTS: RAGKnowledgeDocument[] = [
  // ----------------------------------------------------
  // 1. PAINT CHEMISTRY & FORMULATION
  // ----------------------------------------------------
  {
    id: 'chem-001',
    title: 'Pigment Volume Concentration (PVC) & Critical PVC (CPVC) Dynamics',
    domain: 'paint_chemistry',
    category: 'Formulation Stoichiometry',
    tags: ['pvc', 'cpvc', 'binder_demand', 'durability', 'porosity', 'permeability', 'gloss'],
    summary: 'Mathematical formulation of PVC vs CPVC threshold, determining paint film porosity, tensile strength, scrub resistance, and gloss rating.',
    content: `Pigment Volume Concentration (PVC) defines the volumetric ratio of pigments and extenders to the total non-volatile volume of the coating (pigments + polymer binder).
Formula:
  PVC (%) = [Total Pigment Volume / (Total Pigment Volume + Total Non-Volatile Binder Volume)] * 100

Critical Pigment Volume Concentration (CPVC) represents the exact geometric packing density where binder is just sufficient to fill all voids between pigment particles.
When PVC < CPVC:
  - Polymer binder completely surrounds all particles.
  - Film is continuous, flexible, scrub-resistant, with lower water permeability.
  - High gloss paints (PVC 12-20%), Semi-gloss (PVC 25-35%), Satin/Eggshell (PVC 35-42%).
When PVC > CPVC:
  - Insufficient binder leads to microscopic air voids in the matrix.
  - Film becomes porous, reducing tensile strength, washability, and stain resistance, while dramatically increasing dry hiding (light scattering from pigment-air interfaces) and vapor permeability.
  - Flat/matte ceiling and exterior masonry coatings (PVC 55-75%).`,
    keyFormulas: [
      'PVC = (V_pigment / (V_pigment + V_pigment + V_binder_solids)) * 100',
      'CPVC = 1 / [1 + (OA * SpG / 93.5)] (where OA = Oil Absorption value, SpG = Specific Gravity)',
      'Lambda (Reduced PVC) = PVC / CPVC',
    ],
    practicalTips: [
      'For high-corrosion marine environments, always formulate with Lambda between 0.70 and 0.85 to eliminate through-film micro-capillary water pathways.',
      'Extenders with needle-shaped (acicular) structures such as wollastonite increase CPVC and improve mechanical flexural resistance.',
    ],
    standardSpecs: ['ASTM D2805 (Hiding Power)', 'ISO 4618 (Coatings Terminology)', 'ASTM D2486 (Scrub Resistance)'],
    relevanceKeywords: ['pvc', 'cpvc', 'pigment volume concentration', 'binder demand', 'scrub resistance', 'flat paint', 'gloss', 'porosity', 'permeability'],
  },
  {
    id: 'chem-002',
    title: 'Polymer Emulsion Binders & Polyurethane-Epoxy Matrix Chemistry',
    domain: 'paint_chemistry',
    category: 'Polymer Science',
    tags: ['acrylic_latex', '2k_epoxy', 'polyurethane', 'crosslinking', 'glass_transition_tg'],
    summary: 'Comparative analysis of 100% Pure Acrylic, Styrene-Acrylic, 2K Polyamide Epoxy, and Aliphatic Polyurethane resin networks.',
    content: `Polymer binders form the continuous cohesive matrix that anchors pigments to substrates and dictates UV durability, chemical resistance, and elongation.
1. 100% Pure Acrylic Latex Emulsions:
   - High UV resistance, non-yellowing backbone (methyl methacrylate and butyl acrylate copolymers).
   - Glass Transition Temperature (Tg) ranges from 10°C to 28°C.
   - Requires coalescing solvent (e.g., Texanol, Eastman DPnB) to enable polymer chain interdiffusion below MFFT (Minimum Film Formation Temperature).
2. 2K Polyamide Epoxy:
   - Formed via oxirane ring opening with polyamide/polyamine curing agents (Bisphenol-A/F diglycidyl ether).
   - Exceptional adhesion to steel/concrete and solvent resistance, but prone to UV chalking (aromatic ring degradation).
3. 2K Aliphatic Polyurethane (Isocyanate + Polyol):
   - Hexamethylene diisocyanate (HDI) biuret/isocyanurate reacting with acrylic polyols.
   - High gloss retention, pencil hardness (2H-4H), and chemical resistance for topcoats over epoxy primers.`,
    keyFormulas: [
      'MFFT = Tg - (Plasticization Factor * Coalescent Concentration)',
      'Epoxy Equivalent Weight (EEW) = Molecular Weight / Number of Epoxide Rings',
      'Stoichiometric Amine Hydrogen Equivalent Weight (AHEW) Mix Ratio = (AHEW / EEW) * 100 phr',
    ],
    practicalTips: [
      'In ambient temperatures below 10°C (50°F), increase coalescent loading by 1.5 wt% on resin solids or switch to self-crosslinking acrylics with core-shell morphology.',
      'Check amine blush on epoxy primers using a pH test strip before recoating with aliphatic polyurethane.',
    ],
    standardSpecs: ['ASTM D2354 (MFFT Determination)', 'ASTM D3363 (Pencil Hardness)', 'ISO 4624 (Cross-Cut Pull-Off Adhesion)'],
    relevanceKeywords: ['resin', 'acrylic', 'epoxy', 'polyurethane', 'polymer', 'crosslinking', 'tg', 'mfft', 'coalescent', 'binder', 'isocyanate'],
  },
  {
    id: 'chem-003',
    title: 'Titanium Dioxide Dispersion & Rheology Modification Mechanisms',
    domain: 'paint_chemistry',
    category: 'Dispersions & Rheology',
    tags: ['tio2', 'rutile', 'anatase', 'heur', 'hase', 'thixotropy', 'grind_viscosity'],
    summary: 'Rutile vs Anatase TiO2 light scattering kinetics, steric stabilization dispersants, and associative thickener networks (HEUR/HASE).',
    content: `Titanium Dioxide (TiO2) is the primary white opacifying pigment due to its high refractive index (Rutile n=2.73, Anatase n=2.55 vs polymer resin n=1.48-1.55).
Dispersion Process Stages:
  1. Wetting: Displacing air/moisture from pigment clusters with water and wetting surfactants (HLB 12-14).
  2. Grinding/De-agglomeration: High shear mechanical breakdown of primary agglomerates to 0.20-0.28 micron optimal scattering size.
  3. Stabilization: Electrostatic and steric stabilization via hydrophobically modified polyacrylic acid sodium/ammonium salts to prevent flocculation.

Rheology Modifiers:
  - HEUR (Hydrophobically modified Ethoxylated Urethane): Non-ionic associative thickener generating high-shear ICI viscosity (0.8-2.5 Poise) for brush drag, roller spatter resistance, and film build.
  - HASE (Hydrophobically modified Alkali-Swellable Emulsion): Anionic polymer providing low-shear Krebs Stormer viscosity (85-115 KU) for anti-sag and in-can storage stability.`,
    keyFormulas: [
      'Refractive Contrast Index Factor = [(n_pigment / n_resin) - 1]^2',
      'Optimal Light Scattering Particle Diameter: d_opt = lambda / (2.1 * n_medium) ≈ 0.24 microns for 550nm green light',
      'Krebs Stormer Viscosity conversion: KU to Centipoise log-scale mapping',
    ],
    practicalTips: [
      'Avoid high-temperature milling above 55°C (130°F) during the grind phase as non-ionic surfactants reach their cloud point and destabilize pigment dispersion.',
      'In airless spray formulations, balance HEUR and HASE to maintain high shear thinning under nozzle shear (>10,000 s^-1) with rapid 15-second thixotropic recovery to prevent sag.',
    ],
    standardSpecs: ['ASTM D562 (Consistency in Krebs Units)', 'ASTM D4287 (ICI Cone & Plate Viscosity)', 'ASTM D1210 (Fineness of Dispersion Hegman)'],
    relevanceKeywords: ['tio2', 'titanium dioxide', 'rutile', 'anatase', 'dispersion', 'heur', 'hase', 'rheology', 'viscosity', 'krebs', 'ici', 'thixotropy'],
  },

  // ----------------------------------------------------
  // 2. MANUFACTURING PROCESSES & QUALITY CONTROL
  // ----------------------------------------------------
  {
    id: 'mfg-001',
    title: 'High-Speed Disperser (HSD) Hydrodynamics & Mill Base Kinetic Optimization',
    domain: 'manufacturing_process',
    category: 'Plant Operations',
    tags: ['hsd', 'cowles_blade', 'tip_speed', 'donut_vortex', 'mill_base_rheology'],
    summary: 'Engineering parameters for high-speed disperser tanks, Cowles saw-tooth blades, peripheral tip speed (18-22 m/s), and Daniel flow curve ratios.',
    content: `High-Speed Disperser (HSD) is the industry standard for wetting and pre-dispersing pigments in liquid vehicles prior to horizontal bead milling.
Critical Design Dimensions:
  - Impeller Diameter (D) to Tank Diameter (T): D = 0.33 * T to 0.40 * T.
  - Impeller Clearance from Tank Bottom: H = 0.5 * D to 1.0 * D.
  - Liquid Depth in Tank: L = 1.5 * D to 2.0 * D.
  - Operating Tip Speed: Optimal dispersion occurs between 18.0 m/s and 22.0 m/s (3,500 - 4,300 FPM).

The 'Donut Vortex' Flow Pattern:
  - Achieving a laminar donut vortex ensures 100% of batch volume cycles through the intensive shear zone at the saw-tooth blade tips.
  - Mill base solids content should be maintained between 68% and 75% by weight during dispersion to create viscous laminar resistance without air entrapment.`,
    keyFormulas: [
      'Peripheral Tip Speed: v_tip (m/s) = (pi * D * RPM) / 60 (where D is in meters)',
      'Power Number: N_p = Power / (rho * N^3 * D^5)',
      'Specific Energy Input: E_spec (kWh/ton) = Total Dissipated Power / Batch Mass',
    ],
    practicalTips: [
      'If the donut vortex is lost and slurry creeps up the shaft, mill base viscosity is too high; add 1-2% solvent or grind resin.',
      'If the vortex cavitates and sucks air into the impeller with a whistling sound, mill base is too thin or level is too low, causing micro-foam defect risk.',
    ],
    standardSpecs: ['ISO 8780 (Methods of Dispersion)', 'DIN 53238 (Pigment Dispersibility)', 'SSPC Paint Guide 25'],
    relevanceKeywords: ['hsd', 'disperser', 'cowles', 'tip speed', 'rpm', 'vortex', 'mill base', 'manufacturing', 'bead mill', 'production'],
  },
  {
    id: 'mfg-002',
    title: 'Batch Quality Control Protocols & Hegman Gauge Grind Standardization',
    domain: 'manufacturing_process',
    category: 'Quality Assurance',
    tags: ['hegman_gauge', 'pycnometer', 'byk_gardner', 'drawdown_bar', 'viscometer'],
    summary: 'Standard operating procedures for Hegman grind testing, density pycnometer, Krebs Stormer viscosity, and opacity drawdowns.',
    content: `Standardized Quality Control (QC) testing for architectural and industrial coating batches prior to filling and packaging:
1. Hegman Grind Fineness (ASTM D1210):
   - Dual-channel steel block graduated from 0 to 8 Hegman units (100 to 0 microns).
   - Architectural emulsion: 5.5 - 6.5 Hegman (30 - 20 microns).
   - High-gloss industrial enamel: 7.0 - 7.5 Hegman (12 - 5 microns).
2. Density / Specific Gravity (ASTM D1475):
   - Constant-volume stainless steel pycnometer (100 ml or 83.2 ml cup).
   - Measured at 25.0°C ± 0.5°C to ±0.01 g/cm³.
3. Viscosity Testing:
   - Low-Shear: Krebs-Stormer viscometer (ASTM D562) operating at 200 RPM paddle speed.
   - High-Shear: ICI Cone and Plate viscometer (ASTM D4287) at 10,000 s^-1 shear rate.
4. Opacity / Contrast Ratio (ASTM D2805):
   - Drawdown on black/white Leneta chart with 100 micron (4 mil) wet film applicator.
   - Reflectance over black / Reflectance over white >= 0.98 for complete one-coat hiding.`,
    keyFormulas: [
      'Hegman Micron Conversion: Microns = 100 - (12.5 * Hegman_Reading)',
      'Specific Gravity: SG = (Mass of Paint in Cup - Tare Mass) / (Mass of Water in Cup at 25°C)',
      'Contrast Ratio: CR = R_black / R_white',
    ],
    practicalTips: [
      'Inspect the Hegman gauge within 10 seconds of drawing down before volatile solvents flash off and create false agglomerate specks.',
      'Always filter QC samples through a 100-mesh nylon strainer before viscosity and drawdown tests to remove skin particles.',
    ],
    standardSpecs: ['ASTM D1210 (Hegman Grind)', 'ASTM D1475 (Liquid Density)', 'ASTM D562 (Krebs Viscosity)', 'ASTM D2805 (Hiding Power)'],
    relevanceKeywords: ['hegman', 'qc', 'quality control', 'pycnometer', 'viscosity', 'drawdown', 'leneta', 'density', 'opacity', 'batch testing'],
  },

  // ----------------------------------------------------
  // 3. PAINT APPLICATION PROCESS & EQUIPMENT USE
  // ----------------------------------------------------
  {
    id: 'app-001',
    title: 'Airless Spray Physics, Tip Numbering Decoding & Fluid Dynamics',
    domain: 'application_equipment',
    category: 'Spray Equipment',
    tags: ['airless_spray', 'spray_tips', 'graco', 'titan', 'fluid_pressure', 'atomization', 'overlap'],
    summary: 'Airless tip nomenclature (e.g. 517 = 50° fan, 0.017" orifice), fluid pressure calibration (2000-3300 PSI), fan overlap, and tailing elimination.',
    content: `Airless spray atomization forces high-viscosity coatings through a precision tungsten carbide orifice under extreme hydraulic pressure (1,500 to 3,300 PSI / 100 to 230 bar) without compressed air.
Tip Numbering Standard (3 Digits - e.g., '517'):
  - First Digit ('5'): Fan Angle multiplier by 10 = 50° spray angle, creating a 10-inch (25 cm) wide pattern when sprayed at 12 inches (30 cm) distance.
  - Last Two Digits ('17'): Orifice opening diameter in thousandths of an inch = 0.017 inches (0.43 mm).
  - Theoretical Fluid Flow Rate for 517 tip: ~0.31 GPM (1.17 L/min) at 2000 PSI with water-based latex.

Recommended Tip Configurations:
  - Lacquers & Stains: 309, 311, 411 (0.009" - 0.011", 1,200 - 1,800 PSI).
  - Interior Wall Emulsions: 515, 517 (0.015" - 0.017", 1,800 - 2,200 PSI).
  - Exterior Masonry & Heavy Acrylics: 519, 521, 621 (0.019" - 0.021", 2,200 - 2,800 PSI).
  - High-Build Epoxy / Intumescent / Elastomeric: 527, 631, 635 (0.027" - 0.035", 3,000 - 3,300 PSI).`,
    keyFormulas: [
      'Theoretical Fan Width (inches) = First_Digit * 2 (at 12" gun standoff)',
      'Wet Film Thickness (WFT, mils) = [Flow_Rate (GPM) * 1604] / [Speed (sq ft/min) * Fan_Width (ft)]',
      'Dry Film Thickness (DFT, mils) = WFT * Volume_Solids_Percent / 100',
    ],
    practicalTips: [
      'If spray pattern shows "fingers" or heavy tails at the edges, increase fluid pressure incrementally; if max pressure is reached, thin coating by 5% or switch to a fine-finish low-pressure (FFLP) tip.',
      'Maintain 50% pattern overlap on each pass with the spray gun held perpendicular to the surface at exactly 10-12 inches (25-30 cm).',
    ],
    standardSpecs: ['SSPC PA 1 (Shop, Field, and Maintenance Painting of Steel)', 'ASTM D4414 (Measurement of Wet Film Thickness)'],
    relevanceKeywords: ['airless', 'spray tip', 'graco', 'titan', 'pressure', 'psi', '517', 'atomization', 'wft', 'dft', 'fan angle', 'spray gun'],
  },
  {
    id: 'app-002',
    title: 'Substrate Preparation Standards (SSPC/NACE/ISO) & Dew Point Rules',
    domain: 'application_equipment',
    category: 'Substrate Preparation',
    tags: ['sspc', 'nace', 'iso_8501', 'blast_cleaning', 'dew_point_delta', 'relative_humidity', 'concrete_csp'],
    summary: 'Detailed standard preparation specs for steel (SP-1 to SP-10), Concrete Surface Profile (CSP 1-5), and the 3°C (5°F) Dew Point Rule.',
    content: `Surface preparation constitutes 80% of all premature industrial coating failures.
Steel Surface Preparation (SSPC / NACE / ISO 8501-1):
  - SSPC-SP 1: Solvent Cleaning (removes oil, grease, soil with solvent wipe).
  - SSPC-SP 2 / SP 3: Hand Tool / Power Tool Cleaning (St 2 / St 3).
  - SSPC-SP 6 / NACE 3 / Sa 2: Commercial Blast Cleaning (removes all oil, rust, mill scale with light shadows allowed).
  - SSPC-SP 10 / NACE 2 / Sa 2.5: Near-White Metal Blast (95% of each unit area completely free of all visible residue).
  - Surface Anchor Profile: 50 - 75 microns (2.0 - 3.0 mils) angular profile for epoxy primers.

Concrete Substrate Preparation (ICRI 310.2R):
  - CSP 1-2 (Acid Etch / Diamond Grind): For thin film coatings (<10 mils).
  - CSP 3-5 (Shot Blast / Scarify): For high-build epoxy, polyaspartic, and screed toppings (10-120 mils).

The Crucial 3°C / 5°F Dew Point Rule:
  - Substrate temperature MUST be at least 3.0°C (5.0°F) higher than the ambient Dew Point temperature throughout application and cure to prevent invisible moisture condensation and blister formation.
  - Relative Humidity (RH) must be below 85% for standard waterborne and solvent-borne systems.`,
    keyFormulas: [
      'Dew Point (Magnus Approximation): T_dp = (b * alpha) / (a - alpha) where alpha(T, RH) = (a*T)/(b+T) + ln(RH/100)',
      'Dew Point Delta: Delta_T = T_surface - T_dew_point >= 3.0°C (5.0°F)',
      'Concrete Moisture Vapor Emission Rate (MVER, ASTM F1869): Max 3.0 lbs / 1,000 sq ft / 24 hrs for standard epoxy',
    ],
    practicalTips: [
      'Never apply coating when ambient temperature is falling towards the dew point within 3 hours of dusk on exterior projects.',
      'Check concrete moisture using in-situ RH probes (ASTM F2170) ensuring internal RH is <75-80% before applying non-breathable resinous barriers.',
    ],
    standardSpecs: ['SSPC-SP 10 / NACE 2 / ISO 8501-1 Sa 2.5', 'ICRI Guideline 310.2R (Concrete CSP)', 'ASTM F2170 (In-situ RH in Concrete)'],
    relevanceKeywords: ['substrate', 'sspc', 'nace', 'blast cleaning', 'dew point', 'relative humidity', 'moisture', 'concrete', 'csp', 'shot blast'],
  },

  // ----------------------------------------------------
  // 4. REALTIME PRICING & MARKET INTELLIGENCE
  // ----------------------------------------------------
  {
    id: 'price-001',
    title: 'Raw Material Chemical Spot Indexing & Contractor Buildup Modeling',
    domain: 'realtime_pricing',
    category: 'Cost Engineering',
    tags: ['spot_price', 'cas_number', 'freight_index', 'contractor_margin', 'contingency', 'unit_rates'],
    summary: 'Global spot price benchmarks for Titanium Dioxide, Acrylic Emulsions, Epichlorohydrin, and contractor composite rate algorithms.',
    content: `Coating material cost estimation requires combining chemical commodity spot rates with regional processing markups and local freight indices.
Key Raw Material Spot Price Benchmarks (Global Average 2025/2026):
  - Titanium Dioxide (TiO2 Rutile, CAS 13463-67-7): $3.10 - $3.60 / kg ($1.41 - $1.63 / lb).
  - 100% Pure Acrylic Emulsion (50% Solids): $2.20 - $2.75 / kg ($1.00 - $1.25 / lb).
  - 2K Epoxy Liquid Resin (DGEBA, CAS 25068-38-6): $3.40 - $4.10 / kg ($1.54 - $1.86 / lb).
  - Polyamide Curing Agent: $4.80 - $5.50 / kg ($2.18 - $2.50 / lb).
  - Calcium Carbonate (Heavy Extender, 5 micron): $0.18 - $0.35 / kg ($0.08 - $0.16 / lb).
  - Coalescent Solvent (Texanol / DPnB): $2.90 - $3.45 / kg ($1.32 - $1.56 / lb).

Contractor Cost Buildup Formula:
  Composite Total = [Material_Cost + Labor_Cost + Equipment_Amortization + Substrate_Prep] * (1 + Margin_Rate) * (1 + Contingency_Rate) * (1 + Tax_Rate)`,
    keyFormulas: [
      'Theoretical Material Cost / Unit Area = (Price_Per_Gal / Coverage_SqFt_Per_Gal) * Number_Of_Coats',
      'Effective Coverage (with 15% transfer loss on airless): Cov_eff = Cov_theor * (1 - 0.15)',
      'Composite Contractor Bid = (Direct_Cost / (1 - Target_Gross_Margin_Fraction)) * (1 + Tax)',
    ],
    practicalTips: [
      'Lock in bulk TiO2 commitments on quarterly index agreements when oil and chlorine feedstocks trend upward.',
      'Always add a minimum 10-15% transfer loss factor for airless spraying on flat surfaces and 25-30% for open lattice steel structures.',
    ],
    standardSpecs: ['ICIS Chemical Market Index', 'Platts Chemical Spot Benchmark', 'RSMeans Construction Cost Data'],
    relevanceKeywords: ['pricing', 'spot price', 'cost', 'materials', 'tio2 price', 'acrylic cost', 'contractor margin', 'contingency', 'unit rate', 'quote'],
  },

  // ----------------------------------------------------
  // 5. WALL SCREENING DOMAIN (INTERIOR & EXTERIOR WALL SCREENING)
  // ----------------------------------------------------
  {
    id: 'screed-001',
    title: 'Polymer-Modified Wall Screening Engineering & Skim Coating Dynamics',
    domain: 'wall_screening_domain',
    category: 'Wall Screening & Skim Engineering',
    tags: ['wall_screening', 'interior_wall_screen', 'exterior_wall_screen', 'skim_coat', 'wall_smoothing', 'crack_bridging', 'polymer_mortars'],
    summary: 'Interior and exterior polymer wall screening mortars, skim coating over blockwork & concrete walls, crack-bridging wall screeds, and smooth surface preparation.',
    content: `Wall screening compounds and skim mortars provide ultra-smooth, crack-resistant interior and exterior wall surfaces over masonry, brickwork, poured concrete, and drywall prior to final painting or coating.
Types of Wall Screening Systems:
  1. Interior Wall Screening Skim Coat:
     - Formulated with fine marble dust, redispersible polymer powder (VAE), and cellulose ethers for butter-smooth troweling and zero shrinkage.
     - Application Thickness: 1.0mm to 3.0mm per pass.
  2. Exterior Weatherproof Wall Screening Mortar:
     - Reinforced with polypropylene micro-fibers and hydrophobic silicates to withstand torrential rain, thermal expansion, and UV degradation on building façades.
     - Application Thickness: 3.0mm to 6.0mm per pass.
  3. Polymer-Modified Anti-Crack Wall Screening:
     - High polymer-to-cement ratio providing flexible tensile strain capacity over dynamic wall expansion joints and blockwork interfaces.
     - Application Thickness: 2.0mm to 5.0mm.

Wall Surface Preparation & Application Rules:
  - Substrate Keying: Ensure masonry or concrete wall surfaces are cleaned of form release oils, dust, and loose efflorescence.
  - Priming: Apply alkali-resistant acrylic bonding primer on highly absorbent walls to maintain hydration kinetics and prevent pinholing.
  - Curing: Exterior wall screen mortars require light mist curing for 24 hours under high-ambient heat to ensure full cement hydration and zero crazing.`,
    keyFormulas: [
      'Material Required (kg) = Surface Area (m²) * Coverage Rate (approx 1.2 to 1.5 kg/m² per mm thickness)',
      'Bags Required (25kg) = Material Required (kg) / 25 * 1.05 (5% wastage)',
      'Drying Time Rule: Wall screening coats dry in 6 to 12 hours under 25°C / 60% RH before fine sanding or paint priming.',
    ],
    practicalTips: [
      'Always use a stainless steel wall screening trowel at a 30-degree blade angle to feather edge joint lines smoothly.',
      'Embed alkali-resistant fibreglass mesh into the wet screening mortar across lintels and blockwork joint seams to prevent reflective wall cracking.',
    ],
    standardSpecs: ['ASTM C926 (Application of Portland Cement-Based Screening Mortars)', 'BS EN 998-1 (Specification for Mortar for Masonry - Rendering & Screening)', 'DIN 18550 (Wall Screening & Skim Finish Rules)'],
    relevanceKeywords: ['wall screening', 'wall screed', 'wall skim', 'interior wall screening', 'exterior wall screening', 'wall smoothing', 'skim coat', 'wall prep', 'screening mortar'],
  },

  // ----------------------------------------------------
  // 6. PLASTERING DOMAIN (RENDERING & PLASTERWORK)
  // ----------------------------------------------------
  {
    id: 'plaster-001',
    title: 'Gypsum, Lime & Cementitious Plaster Formulations and Multi-Coat Render',
    domain: 'plastering_domain',
    category: 'Wall Finishes',
    tags: ['gypsum_plaster', 'hydraulic_lime', 'nhl_3_5', 'scratch_coat', 'float_coat', 'skim_coat', 'efflorescence'],
    summary: 'Stoichiometry of Gypsum Hemihydrate vs Hydraulic Lime (NHL 2/3.5/5), multi-coat rendering (Scratch, Brown, Skim), and hydration curing.',
    content: `Plastering and external rendering provide smooth, fire-resistant, and weather-tight architectural wall finishes over masonry, brickwork, and drywall.
1. Gypsum Plaster Chemistry:
   - Calcium Sulfate Hemihydrate: CaSO4 · 0.5 H2O + 1.5 H2O -> CaSO4 · 2 H2O (Gypsum Dihydrate) + Exothermic Heat.
   - Initial set in 20-30 minutes; controlled with potassium sulfate (accelerator) or citric acid/tartrates (retarder).
2. Natural Hydraulic Lime (NHL):
   - Formulated as NHL 2 (feebly hydraulic), NHL 3.5 (moderately hydraulic), NHL 5 (eminently hydraulic).
   - Sets initially through hydraulic reaction with water (dicalcium silicate), followed by long-term carbonation with atmospheric CO2.
   - High vapor permeability ('breathable') essential for historical masonry.
3. Traditional 3-Coat Render System:
   - Coat 1 (Scratch Coat): 1:3 cement:sand mix, 8-10mm thick, combed horizontally with a notched trowel to create mechanical key.
   - Coat 2 (Floating / Brown Coat): 1:4 cement:sand with plasticizer, 6-8mm thick, leveled with a straightedge darby.
   - Coat 3 (Finish / Skim Coat): 2-3mm fine gypsum or lime putty troweled to a glass-smooth finish.`,
    keyFormulas: [
      'Render Mix Ratio by Volume = 1 Part Binder : 3-4 Parts Well-Graded Sharp Sand (0.1mm - 2mm)',
      'Water to Gypsum Plaster Ratio: Typically 0.55 - 0.70 L of water per 1.0 kg of dry powder',
      'Efflorescence Critical Parameter: Salt Content (%) * Moisture Gradient * Evaporation Rate',
    ],
    practicalTips: [
      'In hot windy weather, mist external render coats with clean water for 3 consecutive days to prevent rapid moisture loss and shrinkage cracking (crazing).',
      'Embed alkaline-resistant fiberglass mesh (160 g/m²) diagonally at all 45° window and door corners to absorb structural shear stresses.',
    ],
    standardSpecs: ['BS EN 13914-1 (External Rendering)', 'BS EN 13279-1 (Gypsum Binders and Plasters)', 'ASTM C926 (Application of Portland Cement-Based Plaster)'],
    relevanceKeywords: ['plaster', 'plastering', 'render', 'rendering', 'gypsum', 'lime', 'nhl 3.5', 'scratch coat', 'skim coat', 'trowel', 'hydration'],
  },

  // ----------------------------------------------------
  // 7. IMAGE-TO-3D & VIDEO-TO-3D RECONSTRUCTION
  // ----------------------------------------------------
  {
    id: 'recon-001',
    title: 'Photogrammetry, 3D Gaussian Splatting (3DGS) & LiDAR Metric Calibration',
    domain: 'image_video_to_3d',
    category: 'Spatial Reconstruction',
    tags: ['photogrammetry', '3d_gaussian_splatting', 'sfm', 'mvs', 'lidar', 'poisson_mesh', 'texture_bake'],
    summary: 'Structure-from-Motion (SfM), Dense Multi-View Stereo (MVS), 3D Gaussian Splatting, LiDAR point cloud fusion, and millimeter metric scale calibration.',
    content: `Converting 2D field photo collections and video scans into high-precision 3D surface meshes for automated paint takeoff and volume calculus.
1. Structure-from-Motion (SfM) Pipeline:
   - Feature Detection & Extraction: Scale-Invariant Feature Transform (SIFT) or SuperPoint to extract keypoints across photos.
   - Feature Matching & Epipolar Geometry: Computing Fundamental and Essential matrices with RANSAC outlier rejection.
   - Incremental Bundle Adjustment: Minimizing reprojection error across all camera poses and 3D sparse tie points.
2. Dense Reconstruction & Surface Meshing:
   - Multi-View Stereo (MVS) calculates dense depth maps per frame.
   - Screened Poisson Surface Reconstruction constructs watertight polygon meshes from oriented point clouds.
3. 3D Gaussian Splatting (3DGS):
   - Represents the scene as millions of 3D Gaussian ellipsoids characterized by position (x,y,z), covariance matrix (rotation & scale), opacity (alpha), and spherical harmonics for view-dependent color.
   - Renders in real-time (>100 FPS) via tile-based rasterization.
4. Metric Scale Anchoring:
   - Combining ARKit/ARCore LiDAR depth frames with visual SLAM anchors provides absolute metric millimeter scale calibration to calculate exact wall surface areas in m² or sq ft.`,
    keyFormulas: [
      'Reprojection Error: E = Sum_i Sum_j || x_ij - P_j(X_i) ||^2',
      '3D Gaussian Probability Density: G(x) = exp(-0.5 * (x - mu)^T * Sigma^-1 * (x - mu))',
      'Surface Mesh Area Calculus: Total_Area = Sum_k 0.5 * || (v1_k - v0_k) x (v2_k - v0_k) ||',
    ],
    practicalTips: [
      'Ensure 65-75% forward and 60% side overlap between sequential photos with uniform diffuse lighting to avoid harsh moving specular shadows.',
      'Record a slow circular video at 60 FPS while walking around the architectural facade at a constant 3-4 meter radius.',
    ],
    standardSpecs: ['ASPRS Metric Photogrammetric Standards', 'ISO/IEC 19775 (X3D Graphics Standard)', 'ASTM E57 (3D Imaging Systems Data Exchange)'],
    relevanceKeywords: ['3d', 'photogrammetry', 'gaussian splatting', 'mesh', 'point cloud', 'lidar', 'sfm', 'mvs', 'reconstruction', 'image to 3d', 'video to 3d'],
  },

  // ----------------------------------------------------
  // 8. AI AGENT COORDINATION & MULTI-AGENT MANAGER
  // ----------------------------------------------------
  {
    id: 'agent-001',
    title: 'Multi-Agent Autonomous Orchestration, Task Delegation & Consensus Protocols',
    domain: 'agent_coordination',
    category: 'Agentic Architecture',
    tags: ['multi_agent', 'orchestration', 'task_delegation', 'consensus', 'message_bus', 'estimator_agent', 'qc_agent'],
    summary: 'Autonomous coordination matrix connecting Estimator, Formulator, QC Chemist, Procurement, and Site Coordinator sub-agents with state verification.',
    content: `The Multi-Agent AI system coordinates specialized domain agents across an event-driven message bus with deterministic consensus and rollback guards.
Specialized Agent Roles:
  1. Estimator Agent: Ingests LiDAR mesh polygons and camera inputs; calculates surface area, substrate porosity, and theoretical paint volume.
  2. Formulator Agent: Balances stoichiometry, selects pigment dispersion ratios, calculates binder CPVC, and formulates drum batch recipes.
  3. QC & Compliance Agent: Audits VOC limits against local regulations (CARB, EU Decopaint), verifies SSPC dew-point conditions, and flags health hazards.
  4. Procurement & Pricing Agent: Queries localized raw material spot indices, monitors warehouse stock thresholds, and builds itemized price quotations.
  5. Site Coordinator Agent: Manages contractor communication, dispatches live editable quotations, generates signed PDF certificates, and initiates video conferences.

Agent-to-Agent Coordination Loop:
  [Estimator Scan] -> [Formulator Batching] -> [QC Audit Pass/Fail] -> [Procurement Quotation] -> [Coordinator Dispatch]`,
    keyFormulas: [
      'Agent Confidence Consensus Metric: C_consensus = Sum_i (w_i * c_i) / Sum_i w_i >= 0.88 Threshold',
      'Task Queue State Transition: PENDING -> ANALYZING -> VERIFIED -> EXECUTED',
    ],
    practicalTips: [
      'If the QC Agent fails an environmental parameter (e.g. Dew Point Delta < 3°C), the Coordinator Agent automatically holds the quotation dispatch and issues a field heating alert.',
      'Use small SLM models (e.g. Qwen 2.5 1.5B or SmolLM2) for sub-agent tool execution to maximize speed and minimize memory overhead.',
    ],
    standardSpecs: ['FIPA Multi-Agent System Standards', 'OpenAI Function Calling Spec', 'W3C Web of Things Architecture'],
    relevanceKeywords: ['agent', 'multi agent', 'coordinator', 'orchestration', 'task delegation', 'consensus', 'estimator agent', 'formulator agent', 'qc agent'],
  },

  // ----------------------------------------------------
  // 9. APP NAVIGATION GUIDANCE & DEEP ACTIONS
  // ----------------------------------------------------
  {
    id: 'nav-001',
    title: 'Voice & Text App Navigation Guidance & Instant Action Routing Map',
    domain: 'app_navigation',
    category: 'Application Routing',
    tags: ['navigation', 'routing', 'shortcuts', 'voice_commands', 'deep_link', 'estimator', 'mixer', 'contacts'],
    summary: 'Interactive action registry enabling voice/text queries to directly trigger app modals, switch tabs, initiate video calls, and export documents.',
    content: `The AI Co-Pilot features deep bidirectional links to all WalnusGlobal SmartView -Pro © application interfaces, allowing zero-click execution of field tasks.
Available Instant Actions:
  - 'navigate_estimator': Switches to the 3D LiDAR Estimator viewfinder and surface takeoff interface.
  - 'navigate_mixer': Switches to the Automated Batch Mixer and Pigment Formulation console.
  - 'open_contacts': Opens the left-side Field Site Contacts drawer for Engineer, Painter, Manager, and Bricklayer.
  - 'open_workspace': Opens the Google Workspace panel for Google Docs quote generation and Google Drive sync.
  - 'open_settings': Opens the Advanced Settings & Permissions Console (Sensors, Hardware Diagnostics, Profile).
  - 'open_inventory': Opens the Raw Materials Stock Matrix & Threshold Alert Monitor.
  - 'open_quotation': Generates and presents the Live Editable Quotation or PDF Document export modal.
  - 'trigger_3d_scan': Activates camera scanning and point-cloud mesh triangulation.
  - 'start_video_call': Launches a full-duplex video conference with designated site personnel.`,
    keyFormulas: [
      'Action Execution Latency: T_exec <= 120ms from voice or text trigger',
    ],
    practicalTips: [
      'Type "take me to mixer" or "check inventory alerts" in the Co-Pilot to instantly route directly to that view without manual menu clicking.',
      'Press Ctrl+K or Cmd+K anywhere in the application to toggle the AI Co-Pilot modal instantly.',
    ],
    standardSpecs: ['W3C Web Navigation API', 'Voice Command Intent Mapping Spec'],
    relevanceKeywords: ['navigation', 'navigate', 'go to', 'open', 'switch tab', 'take me to', 'estimator', 'mixer', 'contacts', 'workspace', 'settings', 'inventory', 'help'],
  },
];
