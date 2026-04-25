---
name: curate-analysis-type
description: Review datasets whose analysisType is missing or set to "not specified", recommend an existing analysisType when strongly supported, otherwise keep "not specified" and optionally suggest a new category for schema review.
allowed-tools:
  - Skill
  - mcp__bioenergy-datasets__search_datasets
  - mcp__bioenergy-datasets__get_dataset
---

# Curate dataset analysisType

Use this skill to review datasets with missing `analysisType` or `analysisType: "not specified"`.

This skill is read-only. Do not modify dataset records. Produce a running recommendation list for curator review.

## Allowed current analysisType values

These values are currently valid in the schema:

- affinity_purification
- cross_linking
- Expression profiling
- Genomic - SNP calling
- image_analysis
- Ms_imaging
- shotgun_proteomics
- srm_mrm
- swath_ms
- Targeted Locus (Loci)
- not specified

`not specified` is a valid outcome. Do not force a classification when the evidence is weak or ambiguous.

## Scope limit

Review a maximum of 5 datasets per run.

If more than 5 candidate datasets are returned, process only the first 5 results from the current search unless the user explicitly asks for another batch.

## Goal

For each reviewed dataset, determine one of the following outcomes:

1. **Assign existing value**
   - The metadata strongly supports one existing allowed analysisType value.

2. **Leave as not specified**
   - The metadata is weak, ambiguous, incomplete, or does not justify a confident assignment.

3. **Suggest new value for schema review**
   - The metadata strongly supports a coherent analysis category, but none of the currently allowed values fits well.
   - In this case, still keep the recommended analysisType as `not specified` and record the suggested new value separately.

## Required output format

Maintain a running list. For each dataset reviewed, record:

- uid
- identifier, if available
- title, if available
- current analysisType
- recommended analysisType
- confidence: high, medium, or low
- outcome:
  - assign existing value
  - leave as not specified
  - suggest new value for schema review
- suggested new value, only when outcome is "suggest new value for schema review"
- evidence summary: 1 to 3 short sentences based on the metadata

Use this exact template for each entry:

UID: <uid>
Identifier: <identifier or "not available">
Title: <title or "not available">
Current analysisType: <current value or "not specified">
Recommended analysisType: <existing enum value or "not specified">
Confidence: <high|medium|low>
Outcome: <assign existing value|leave as not specified|suggest new value for schema review>
Suggested new value: <value or "none">
Evidence: <brief evidence summary>

## Workflow

1. Call `search_datasets` to find candidate datasets with:
   - `analysisType = "not specified"`
   - optional `brc` filter if the user requests a specific center
   - optional text query if the user wants to focus on a topic

2. Limit the review to at most 5 datasets from the current result set.

3. For each selected dataset, call `get_dataset` to inspect the full record.

4. Review the metadata carefully. Prefer the following evidence sources:
   - title
   - summary or description
   - methods
   - platform
   - instrument
   - keywords
   - assay details
   - source or repository metadata
   - any fields that indicate the experimental or computational analysis type

5. Decide the outcome conservatively:
   - If one existing enum value is strongly supported, recommend it.
   - If no existing enum fits and a new category is strongly evidenced, recommend `not specified` and separately suggest a new value.
   - If the evidence is weak or mixed, recommend `not specified`.

6. Continue building the running list for only those 5 datasets.

## Classification guidance

Use conservative mapping. Prefer precision over coverage.

- `image_analysis`
  - Use for image-derived analysis workflows, microscopy image analysis, computer vision on experimental images, or other image-centric analyses.

- `shotgun_proteomics`
  - Use for untargeted proteomics datasets, especially LC-MS/MS proteomics where broad protein identification is the goal.

- `Expression profiling`
  - Use for transcriptomics, gene expression profiling, RNA expression measurements, or expression-focused omics datasets.

- `Genomic - SNP calling`
  - Use for datasets centered on variant calling, SNP detection, or genotype calling.

- `Ms_imaging`
  - Use for mass spectrometry imaging workflows.

- `srm_mrm`
  - Use for targeted SRM/MRM mass spectrometry.

- `swath_ms`
  - Use for SWATH or DIA proteomics.

- `Targeted Locus (Loci)`
  - Use for targeted locus-based sequencing or locus-specific assays.

- `affinity_purification`
  - Use only when affinity purification is clearly part of the experimental design or analysis.

- `cross_linking`
  - Use only when cross-linking is clearly described in the workflow.

## Rules

- Always use MCP tools to access dataset data.
- When reading search results, always use the `uid` field for subsequent `get_dataset` calls.
- Never use the `id` field from search results as input to `get_dataset`.
- Prefer the smallest result set needed for triage.
- Do not call the API directly using curl or other shell commands.
- Do not construct HTTP requests manually.
- For `Recommended analysisType`, use only a currently allowed schema value or `not specified`.
- If no current schema value fits well, keep `Recommended analysisType` as `not specified`.
- If the metadata strongly supports a coherent category that is missing from the current schema, record it separately in `Suggested new value`.
- Do not treat `Suggested new value` as an assigned dataset value.
- Do not update any dataset records. This skill is read-only and produces recommendations only.
- Prefer leaving `analysisType` as `not specified` over making a weak or uncertain assignment.
- Never review more than 5 datasets in a single run unless the user explicitly requests another batch.
- Keep evidence summaries short, concrete, and grounded in the dataset metadata.
