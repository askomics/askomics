{
"module"  : "BioPAX : Biological Pathways Exchange",
"comment" : "BioPAX is a standard language that aims to enable integration, exchange, visualization and analysis of biological pathway data. http://www.biopax.org/",
"version" : "1.0",
"owl"     : "http://www.biopax.org/release/biopax-level3.owl",
"rdf"     : [
"@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>",
"@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#>",
"@prefix owl: <http://www.w3.org/2002/07/owl#>",
"@prefix xsd: <http://www.w3.org/2001/XMLSchema#>",
"@prefix biopax3: <http://www.biopax.org/release/biopax-level3.owl#>",
"@prefix displaySetting: <http://www.irisa.fr/dyliss/rdfVisualization/display>",
"biopax3:Pathway rdfs:label \"biopax3:Pathway\";",
	"displaySetting:entity \"true\"^^xsd:boolean;",
	"displaySetting:startPoint \"true\"^^xsd:boolean .",

"biopax3:BindingFeature rdfs:label \"biopax3:BindingFeature\";",
	"displaySetting:entity \"true\"^^xsd:boolean;",
	"displaySetting:startPoint \"true\"^^xsd:boolean .",

"biopax3:BioSource rdfs:label \"biopax3:BioSource\";",
	"displaySetting:entity \"true\"^^xsd:boolean;",
	"displaySetting:startPoint \"true\"^^xsd:boolean .",

"biopax3:BiochemicalPathwayStep rdfs:label \"biopax3:BiochemicalPathwayStep\";",
	"displaySetting:entity \"true\"^^xsd:boolean;",
	"displaySetting:startPoint \"true\"^^xsd:boolean .",

"biopax3:BiochemicalReaction rdfs:label \"biopax3:BiochemicalReaction\";",
	"displaySetting:entity \"true\"^^xsd:boolean;",
	"displaySetting:startPoint \"true\"^^xsd:boolean .",

"biopax3:Catalysis rdfs:label \"biopax3:Catalysis\";",
	"displaySetting:entity \"true\"^^xsd:boolean;",
	"displaySetting:startPoint \"true\"^^xsd:boolean .",

"biopax3:CellVocabulary rdfs:label \"biopax3:CellVocabulary\";",
	"displaySetting:entity \"true\"^^xsd:boolean;",
	"displaySetting:startPoint \"true\"^^xsd:boolean .",

"biopax3:CellularLocationVocabulary rdfs:label \"biopax3:CellularLocationVocabulary\";",
	"displaySetting:entity \"true\"^^xsd:boolean;",
	"displaySetting:startPoint \"true\"^^xsd:boolean .",

"biopax3:ChemicalStructure rdfs:label \"biopax3:ChemicalStructure\";",
	"displaySetting:entity \"true\"^^xsd:boolean;",
	"displaySetting:startPoint \"true\"^^xsd:boolean .",

"biopax3:Complex rdfs:label \"biopax3:Complex\";",
	"displaySetting:entity \"true\"^^xsd:boolean;",
	"displaySetting:startPoint \"true\"^^xsd:boolean .",

"biopax3:ComplexAssembly rdfs:label \"biopax3:ComplexAssembly\";",
	"displaySetting:entity \"true\"^^xsd:boolean;",
	"displaySetting:startPoint \"true\"^^xsd:boolean .",

"biopax3:Control rdfs:label \"biopax3:Control\";",
	"displaySetting:entity \"true\"^^xsd:boolean;",
	"displaySetting:startPoint \"true\"^^xsd:boolean .",

"biopax3:ControlledVocabulary rdfs:label \"biopax3:ControlledVocabulary\";",
	"displaySetting:entity \"true\"^^xsd:boolean;",
	"displaySetting:startPoint \"true\"^^xsd:boolean .",

"biopax3:Conversion rdfs:label \"biopax3:Conversion\";",
	"displaySetting:entity \"true\"^^xsd:boolean;",
	"displaySetting:startPoint \"true\"^^xsd:boolean .",

"biopax3:CovalentBindingFeature rdfs:label \"biopax3:CovalentBindingFeature\";",
	"displaySetting:entity \"true\"^^xsd:boolean;",
	"displaySetting:startPoint \"true\"^^xsd:boolean .",

"biopax3:Degradation rdfs:label \"biopax3:Degradation\";",
	"displaySetting:entity \"true\"^^xsd:boolean;",
	"displaySetting:startPoint \"true\"^^xsd:boolean .",

"biopax3:DeltaG rdfs:label \"biopax3:DeltaG\";",
	"displaySetting:entity \"true\"^^xsd:boolean;",
	"displaySetting:startPoint \"true\"^^xsd:boolean .",

"biopax3:Dna rdfs:label \"biopax3:Dna\";",
	"displaySetting:entity \"true\"^^xsd:boolean;",
	"displaySetting:startPoint \"true\"^^xsd:boolean .",

"biopax3:DnaReference rdfs:label \"biopax3:DnaReference\";",
	"displaySetting:entity \"true\"^^xsd:boolean;",
	"displaySetting:startPoint \"true\"^^xsd:boolean .",

"biopax3:DnaRegion rdfs:label \"biopax3:DnaRegion\";",
	"displaySetting:entity \"true\"^^xsd:boolean;",
	"displaySetting:startPoint \"true\"^^xsd:boolean .",

"biopax3:DnaRegionReference rdfs:label \"biopax3:DnaRegionReference\";",
	"displaySetting:entity \"true\"^^xsd:boolean;",
	"displaySetting:startPoint \"true\"^^xsd:boolean .",

"biopax3:Entity rdfs:label \"biopax3:Entity\";",
	"displaySetting:entity \"true\"^^xsd:boolean;",
	"displaySetting:startPoint \"true\"^^xsd:boolean .",

"biopax3:EntityFeature rdfs:label \"biopax3:EntityFeature\";",
	"displaySetting:entity \"true\"^^xsd:boolean;",
	"displaySetting:startPoint \"true\"^^xsd:boolean .",

"biopax3:EntityReference rdfs:label \"biopax3:EntityReference\";",
	"displaySetting:entity \"true\"^^xsd:boolean;",
	"displaySetting:startPoint \"true\"^^xsd:boolean .",

"biopax3:EntityReferenceTypeVocabulary rdfs:label \"biopax3:EntityReferenceTypeVocabulary\";",
	"displaySetting:entity \"true\"^^xsd:boolean;",
	"displaySetting:startPoint \"true\"^^xsd:boolean .",

"biopax3:Evidence rdfs:label \"biopax3:Evidence\";",
	"displaySetting:entity \"true\"^^xsd:boolean;",
	"displaySetting:startPoint \"true\"^^xsd:boolean .",

"biopax3:EvidenceCodeVocabulary rdfs:label \"biopax3:EvidenceCodeVocabulary\";",
	"displaySetting:entity \"true\"^^xsd:boolean;",
	"displaySetting:startPoint \"true\"^^xsd:boolean .",

"biopax3:ExperimentalForm rdfs:label \"biopax3:ExperimentalForm\";",
	"displaySetting:entity \"true\"^^xsd:boolean;",
	"displaySetting:startPoint \"true\"^^xsd:boolean .",

"biopax3:ExperimentalFormVocabulary rdfs:label \"biopax3:ExperimentalFormVocabulary\";",
	"displaySetting:entity \"true\"^^xsd:boolean;",
	"displaySetting:startPoint \"true\"^^xsd:boolean .",

"biopax3:FragmentFeature rdfs:label \"biopax3:FragmentFeature\";",
	"displaySetting:entity \"true\"^^xsd:boolean;",
	"displaySetting:startPoint \"true\"^^xsd:boolean .",

"biopax3:Gene rdfs:label \"biopax3:Gene\";",
	"displaySetting:entity \"true\"^^xsd:boolean;",
	"displaySetting:startPoint \"true\"^^xsd:boolean .",

"biopax3:GeneticInteraction rdfs:label \"biopax3:GeneticInteraction\";",
	"displaySetting:entity \"true\"^^xsd:boolean;",
	"displaySetting:startPoint \"true\"^^xsd:boolean .",

"biopax3:Interaction rdfs:label \"biopax3:Interaction\";",
	"displaySetting:entity \"true\"^^xsd:boolean;",
	"displaySetting:startPoint \"true\"^^xsd:boolean .",

"biopax3:InteractionVocabulary rdfs:label \"biopax3:InteractionVocabulary\";",
	"displaySetting:entity \"true\"^^xsd:boolean;",
	"displaySetting:startPoint \"true\"^^xsd:boolean .",

"biopax3:KPrime rdfs:label \"biopax3:KPrime\";",
	"displaySetting:entity \"true\"^^xsd:boolean;",
	"displaySetting:startPoint \"true\"^^xsd:boolean .",

"biopax3:ModificationFeature rdfs:label \"biopax3:ModificationFeature\";",
	"displaySetting:entity \"true\"^^xsd:boolean;",
	"displaySetting:startPoint \"true\"^^xsd:boolean .",

"biopax3:Modulation rdfs:label \"biopax3:Modulation\";",
	"displaySetting:entity \"true\"^^xsd:boolean;",
	"displaySetting:startPoint \"true\"^^xsd:boolean .",

"biopax3:MolecularInteraction rdfs:label \"biopax3:MolecularInteraction\";",
	"displaySetting:entity \"true\"^^xsd:boolean;",
	"displaySetting:startPoint \"true\"^^xsd:boolean .",

"biopax3:PathwayStep rdfs:label \"biopax3:PathwayStep\";",
	"displaySetting:entity \"true\"^^xsd:boolean;",
	"displaySetting:startPoint \"true\"^^xsd:boolean .",

"biopax3:PhenotypeVocabulary rdfs:label \"biopax3:PhenotypeVocabulary\";",
	"displaySetting:entity \"true\"^^xsd:boolean;",
	"displaySetting:startPoint \"true\"^^xsd:boolean .",

"biopax3:PhysicalEntity rdfs:label \"biopax3:PhysicalEntity\";",
	"displaySetting:entity \"true\"^^xsd:boolean;",
	"displaySetting:startPoint \"true\"^^xsd:boolean .",

"biopax3:Protein rdfs:label \"biopax3:Protein\";",
	"displaySetting:entity \"true\"^^xsd:boolean;",
	"displaySetting:startPoint \"true\"^^xsd:boolean .",

"biopax3:ProteinReference rdfs:label \"biopax3:ProteinReference\";",
	"displaySetting:entity \"true\"^^xsd:boolean;",
	"displaySetting:startPoint \"true\"^^xsd:boolean .",

"biopax3:Provenance rdfs:label \"biopax3:Provenance\";",
	"displaySetting:entity \"true\"^^xsd:boolean;",
	"displaySetting:startPoint \"true\"^^xsd:boolean .",

"biopax3:PublicationXref rdfs:label \"biopax3:PublicationXref\";",
	"displaySetting:entity \"true\"^^xsd:boolean;",
	"displaySetting:startPoint \"true\"^^xsd:boolean .",

"biopax3:RelationshipTypeVocabulary rdfs:label \"biopax3:RelationshipTypeVocabulary\";",
	"displaySetting:entity \"true\"^^xsd:boolean;",
	"displaySetting:startPoint \"true\"^^xsd:boolean .",

"biopax3:RelationshipXref rdfs:label \"biopax3:RelationshipXref\";",
	"displaySetting:entity \"true\"^^xsd:boolean;",
	"displaySetting:startPoint \"true\"^^xsd:boolean .",

"biopax3:Rna rdfs:label \"biopax3:Rna\";",
	"displaySetting:entity \"true\"^^xsd:boolean;",
	"displaySetting:startPoint \"true\"^^xsd:boolean .",

"biopax3:RnaReference rdfs:label \"biopax3:RnaReference\";",
	"displaySetting:entity \"true\"^^xsd:boolean;",
	"displaySetting:startPoint \"true\"^^xsd:boolean .",

"biopax3:RnaRegion rdfs:label \"biopax3:RnaRegion\";",
	"displaySetting:entity \"true\"^^xsd:boolean;",
	"displaySetting:startPoint \"true\"^^xsd:boolean .",

"biopax3:RnaRegionReference rdfs:label \"biopax3:RnaRegionReference\";",
	"displaySetting:entity \"true\"^^xsd:boolean;",
	"displaySetting:startPoint \"true\"^^xsd:boolean .",

"biopax3:Score rdfs:label \"biopax3:Score\";",
	"displaySetting:entity \"true\"^^xsd:boolean;",
	"displaySetting:startPoint \"true\"^^xsd:boolean .",

"biopax3:SequenceInterval rdfs:label \"biopax3:SequenceInterval\";",
	"displaySetting:entity \"true\"^^xsd:boolean;",
	"displaySetting:startPoint \"true\"^^xsd:boolean .",

"biopax3:SequenceLocation rdfs:label \"biopax3:SequenceLocation\";",
	"displaySetting:entity \"true\"^^xsd:boolean;",
	"displaySetting:startPoint \"true\"^^xsd:boolean .",

"biopax3:SequenceModificationVocabulary rdfs:label \"biopax3:SequenceModificationVocabulary\";",
	"displaySetting:entity \"true\"^^xsd:boolean;",
	"displaySetting:startPoint \"true\"^^xsd:boolean .",

"biopax3:SequenceRegionVocabulary rdfs:label \"biopax3:SequenceRegionVocabulary\";",
	"displaySetting:entity \"true\"^^xsd:boolean;",
	"displaySetting:startPoint \"true\"^^xsd:boolean .",

"biopax3:SequenceSite rdfs:label \"biopax3:SequenceSite\";",
	"displaySetting:entity \"true\"^^xsd:boolean;",
	"displaySetting:startPoint \"true\"^^xsd:boolean .",

"biopax3:SmallMolecule rdfs:label \"biopax3:SmallMolecule\";",
	"displaySetting:entity \"true\"^^xsd:boolean;",
	"displaySetting:startPoint \"true\"^^xsd:boolean .",

"biopax3:SmallMoleculeReference rdfs:label \"biopax3:SmallMoleculeReference\";",
	"displaySetting:entity \"true\"^^xsd:boolean;",
	"displaySetting:startPoint \"true\"^^xsd:boolean .",

"biopax3:Stoichiometry rdfs:label \"biopax3:Stoichiometry\";",
	"displaySetting:entity \"true\"^^xsd:boolean;",
	"displaySetting:startPoint \"true\"^^xsd:boolean .",

"biopax3:TemplateReaction rdfs:label \"biopax3:TemplateReaction\";",
	"displaySetting:entity \"true\"^^xsd:boolean;",
	"displaySetting:startPoint \"true\"^^xsd:boolean .",

"biopax3:TemplateReactionRegulation rdfs:label \"biopax3:TemplateReactionRegulation\";",
	"displaySetting:entity \"true\"^^xsd:boolean;",
	"displaySetting:startPoint \"true\"^^xsd:boolean .",

"biopax3:TissueVocabulary rdfs:label \"biopax3:TissueVocabulary\";",
	"displaySetting:entity \"true\"^^xsd:boolean;",
	"displaySetting:startPoint \"true\"^^xsd:boolean .",

"biopax3:Transport rdfs:label \"biopax3:Transport\";",
	"displaySetting:entity \"true\"^^xsd:boolean;",
	"displaySetting:startPoint \"true\"^^xsd:boolean .",

"biopax3:TransportWithBiochemicalReaction rdfs:label \"biopax3:TransportWithBiochemicalReaction\";",
	"displaySetting:entity \"true\"^^xsd:boolean;",
	"displaySetting:startPoint \"true\"^^xsd:boolean .",

"biopax3:UnificationXref rdfs:label \"biopax3:UnificationXref\";",
	"displaySetting:entity \"true\"^^xsd:boolean;",
	"displaySetting:startPoint \"true\"^^xsd:boolean .",

"biopax3:UtilityClass rdfs:label \"biopax3:UtilityClass\";",
	"displaySetting:entity \"true\"^^xsd:boolean;",
	"displaySetting:startPoint \"true\"^^xsd:boolean .",

"biopax3:Xref rdfs:label \"biopax3:Xref\";",
	"displaySetting:entity \"true\"^^xsd:boolean;",
	"displaySetting:startPoint \"true\"^^xsd:boolean .",
	"biopax3:author displaySetting:attribute \"true\"^^xsd:boolean .",
"biopax3:author rdf:type owl:DatatypeProperty ;",
"rdfs:label \"biopax3:author\";",
"rdfs:domain biopax3:PublicationXref;",
"rdfs:range http://www.w3.org/2001/XMLSchema#string.",
"biopax3:author displaySetting:attribute \"true\"^^xsd:boolean .",
"biopax3:author rdf:type owl:DatatypeProperty ;",
"rdfs:label \"biopax3:author\";",
"rdfs:domain biopax3:PublicationXref;",
"rdfs:range http://www.w3.org/2001/XMLSchema#string.",

"biopax3:availability displaySetting:attribute \"true\"^^xsd:boolean .",
"biopax3:availability rdf:type owl:DatatypeProperty ;",
"rdfs:label \"biopax3:availability\";",
"rdfs:domain biopax3:Entity;",
"rdfs:range http://www.w3.org/2001/XMLSchema#string.",

"biopax3:chemicalFormula displaySetting:attribute \"true\"^^xsd:boolean .",
"biopax3:chemicalFormula rdf:type owl:DatatypeProperty ;",
"rdfs:label \"biopax3:chemicalFormula\";",
"rdfs:domain biopax3:SmallMoleculeReference;",
"rdfs:range http://www.w3.org/2001/XMLSchema#string.",

"biopax3:db displaySetting:attribute \"true\"^^xsd:boolean .",
"biopax3:db rdf:type owl:DatatypeProperty ;",
"rdfs:label \"biopax3:db\";",
"rdfs:domain biopax3:Xref;",
"rdfs:range http://www.w3.org/2001/XMLSchema#string.",

"biopax3:dbVersion displaySetting:attribute \"true\"^^xsd:boolean .",
"biopax3:dbVersion rdf:type owl:DatatypeProperty ;",
"rdfs:label \"biopax3:dbVersion\";",
"rdfs:domain biopax3:Xref;",
"rdfs:range http://www.w3.org/2001/XMLSchema#string.",

"biopax3:deltaGPrime0 displaySetting:attribute \"true\"^^xsd:boolean .",
"biopax3:deltaGPrime0 rdf:type owl:DatatypeProperty ;",
"rdfs:label \"biopax3:deltaGPrime0\";",
"rdfs:domain biopax3:DeltaG;",
"rdfs:range http://www.w3.org/2001/XMLSchema#float.",

"biopax3:deltaH displaySetting:attribute \"true\"^^xsd:boolean .",
"biopax3:deltaH rdf:type owl:DatatypeProperty ;",
"rdfs:label \"biopax3:deltaH\";",
"rdfs:domain biopax3:BiochemicalReaction;",
"rdfs:range http://www.w3.org/2001/XMLSchema#float.",

"biopax3:deltaS displaySetting:attribute \"true\"^^xsd:boolean .",
"biopax3:deltaS rdf:type owl:DatatypeProperty ;",
"rdfs:label \"biopax3:deltaS\";",
"rdfs:domain biopax3:BiochemicalReaction;",
"rdfs:range http://www.w3.org/2001/XMLSchema#float.",

"biopax3:eCNumber displaySetting:attribute \"true\"^^xsd:boolean .",
"biopax3:eCNumber rdf:type owl:DatatypeProperty ;",
"rdfs:label \"biopax3:eCNumber\";",
"rdfs:domain biopax3:BiochemicalReaction;",
"rdfs:range http://www.w3.org/2001/XMLSchema#string.",

"biopax3:id displaySetting:attribute \"true\"^^xsd:boolean .",
"biopax3:id rdf:type owl:DatatypeProperty ;",
"rdfs:label \"biopax3:id\";",
"rdfs:domain biopax3:Xref;",
"rdfs:range http://www.w3.org/2001/XMLSchema#string.",

"biopax3:idVersion displaySetting:attribute \"true\"^^xsd:boolean .",
"biopax3:idVersion rdf:type owl:DatatypeProperty ;",
"rdfs:label \"biopax3:idVersion\";",
"rdfs:domain biopax3:Xref;",
"rdfs:range http://www.w3.org/2001/XMLSchema#string.",

"biopax3:intraMolecular displaySetting:attribute \"true\"^^xsd:boolean .",
"biopax3:intraMolecular rdf:type owl:DatatypeProperty ;",
"rdfs:label \"biopax3:intraMolecular\";",
"rdfs:domain biopax3:BindingFeature;",
"rdfs:range http://www.w3.org/2001/XMLSchema#boolean.",

"biopax3:kPrime displaySetting:attribute \"true\"^^xsd:boolean .",
"biopax3:kPrime rdf:type owl:DatatypeProperty ;",
"rdfs:label \"biopax3:kPrime\";",
"rdfs:domain biopax3:KPrime;",
"rdfs:range http://www.w3.org/2001/XMLSchema#float.",

"biopax3:molecularWeight displaySetting:attribute \"true\"^^xsd:boolean .",
"biopax3:molecularWeight rdf:type owl:DatatypeProperty ;",
"rdfs:label \"biopax3:molecularWeight\";",
"rdfs:domain biopax3:SmallMoleculeReference;",
"rdfs:range http://www.w3.org/2001/XMLSchema#float.",

"biopax3:patoData displaySetting:attribute \"true\"^^xsd:boolean .",
"biopax3:patoData rdf:type owl:DatatypeProperty ;",
"rdfs:label \"biopax3:patoData\";",
"rdfs:domain biopax3:PhenotypeVocabulary;",
"rdfs:range http://www.w3.org/2001/XMLSchema#string.",

"biopax3:sequencePosition displaySetting:attribute \"true\"^^xsd:boolean .",
"biopax3:sequencePosition rdf:type owl:DatatypeProperty ;",
"rdfs:label \"biopax3:sequencePosition\";",
"rdfs:domain biopax3:SequenceSite;",
"rdfs:range http://www.w3.org/2001/XMLSchema#int.",

"biopax3:source displaySetting:attribute \"true\"^^xsd:boolean .",
"biopax3:source rdf:type owl:DatatypeProperty ;",
"rdfs:label \"biopax3:source\";",
"rdfs:domain biopax3:PublicationXref;",
"rdfs:range http://www.w3.org/2001/XMLSchema#string.",

"biopax3:spontaneous displaySetting:attribute \"true\"^^xsd:boolean .",
"biopax3:spontaneous rdf:type owl:DatatypeProperty ;",
"rdfs:label \"biopax3:spontaneous\";",
"rdfs:domain biopax3:Conversion;",
"rdfs:range http://www.w3.org/2001/XMLSchema#boolean.",

"biopax3:stoichiometricCoefficient displaySetting:attribute \"true\"^^xsd:boolean .",
"biopax3:stoichiometricCoefficient rdf:type owl:DatatypeProperty ;",
"rdfs:label \"biopax3:stoichiometricCoefficient\";",
"rdfs:domain biopax3:Stoichiometry;",
"rdfs:range http://www.w3.org/2001/XMLSchema#float.",

"biopax3:structureData displaySetting:attribute \"true\"^^xsd:boolean .",
"biopax3:structureData rdf:type owl:DatatypeProperty ;",
"rdfs:label \"biopax3:structureData\";",
"rdfs:domain biopax3:ChemicalStructure;",
"rdfs:range http://www.w3.org/2001/XMLSchema#string.",

"biopax3:term displaySetting:attribute \"true\"^^xsd:boolean .",
"biopax3:term rdf:type owl:DatatypeProperty ;",
"rdfs:label \"biopax3:term\";",
"rdfs:domain biopax3:ControlledVocabulary;",
"rdfs:range http://www.w3.org/2001/XMLSchema#string.",

"biopax3:title displaySetting:attribute \"true\"^^xsd:boolean .",
"biopax3:title rdf:type owl:DatatypeProperty ;",
"rdfs:label \"biopax3:title\";",
"rdfs:domain biopax3:PublicationXref;",
"rdfs:range http://www.w3.org/2001/XMLSchema#string.",

"biopax3:url displaySetting:attribute \"true\"^^xsd:boolean .",
"biopax3:url rdf:type owl:DatatypeProperty ;",
"rdfs:label \"biopax3:url\";",
"rdfs:domain biopax3:PublicationXref;",
"rdfs:range http://www.w3.org/2001/XMLSchema#string.",

"biopax3:value displaySetting:attribute \"true\"^^xsd:boolean .",
"biopax3:value rdf:type owl:DatatypeProperty ;",
"rdfs:label \"biopax3:value\";",
"rdfs:domain biopax3:Score;",
"rdfs:range http://www.w3.org/2001/XMLSchema#string.",

"biopax3:year displaySetting:attribute \"true\"^^xsd:boolean .",
"biopax3:year rdf:type owl:DatatypeProperty ;",
"rdfs:label \"biopax3:year\";",
"rdfs:domain biopax3:PublicationXref;",
"rdfs:range http://www.w3.org/2001/XMLSchema#int."
]
}
