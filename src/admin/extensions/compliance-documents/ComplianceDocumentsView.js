import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Flex, 
  Typography, 
  Button, 
  Badge, 
  Card, 
  CardBody, 
  CardHeader,
  Modal,
  ModalLayout,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Grid,
  GridItem,
  Alert,
  Loader
} from '@strapi/design-system';
import { Eye, Download, Check, X, FileText, AlertTriangle } from '@strapi/icons';
import { useFetchClient } from '@strapi/helper-plugin';

const ComplianceDocumentsView = ({ doctorId }) => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [updating, setUpdating] = useState(false);
  
  const { get, put } = useFetchClient();

  // Document types configuration
  const documentTypes = {
    gmc_registration: { name: 'GMC Registration', required: true },
    current_performers_list: { name: 'Current Performers List', required: true },
    cct_certificate: { name: 'CCT Certificate', required: true },
    medical_indemnity: { name: 'Medical Indemnity', required: true },
    dbs_check: { name: 'DBS Check', required: true },
    right_to_work: { name: 'Right to Work', required: true },
    photo_id: { name: 'Photo ID', required: true },
    gp_cv: { name: 'GP CV', required: true },
    occupational_health: { name: 'Occupational Health', required: true },
    professional_references: { name: 'Professional References', required: true },
    appraisal_revalidation: { name: 'Appraisal & Revalidation', required: true },
    basic_life_support: { name: 'Basic Life Support', required: true },
    level3_adult_safeguarding: { name: 'Level 3 Adult Safeguarding', required: true },
    level3_child_safeguarding: { name: 'Level 3 Child Safeguarding', required: true },
    information_governance: { name: 'Information Governance', required: true },
    autism_learning_disability: { name: 'Autism & Learning Disability', required: true },
    equality_diversity: { name: 'Equality & Diversity', required: true },
    health_safety_welfare: { name: 'Health, Safety & Welfare', required: true },
    conflict_resolution: { name: 'Conflict Resolution', required: true },
    fire_safety: { name: 'Fire Safety', required: true },
    infection_prevention: { name: 'Infection Prevention', required: true },
    moving_handling: { name: 'Moving & Handling', required: true },
    preventing_radicalisation: { name: 'Preventing Radicalisation', required: true }
  };

  // Load compliance documents for the doctor
  useEffect(() => {
    if (doctorId) {
      loadDocuments();
    }
  }, [doctorId]);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const response = await get(`/compliance-documents/doctor/${doctorId}`);
      setDocuments(response.data.data || []);
    } catch (err) {
      console.error('Error loading documents:', err);
      setError('Failed to load compliance documents');
    } finally {
      setLoading(false);
    }
  };

  // Get status badge variant and color
  const getStatusBadge = (status, verificationStatus) => {
    if (status === 'missing') {
      return { variant: 'danger', text: 'Missing' };
    }
    
    if (status === 'uploaded') {
      switch (verificationStatus) {
        case 'verified':
          return { variant: 'success', text: 'Verified' };
        case 'rejected':
          return { variant: 'danger', text: 'Rejected' };
        case 'pending':
        default:
          return { variant: 'warning', text: 'Pending Review' };
      }
    }
    
    return { variant: 'neutral', text: status };
  };

  // Handle document verification
  const handleVerification = async (documentId, verificationStatus) => {
    try {
      setUpdating(true);
      await put(`/compliance-documents/${documentId}/verify`, {
        data: {
          verificationStatus,
          notes: `${verificationStatus === 'verified' ? 'Approved' : 'Rejected'} by admin`
        }
      });
      
      // Refresh documents
      await loadDocuments();
      setIsModalOpen(false);
      setSelectedDocument(null);
    } catch (err) {
      console.error('Error updating verification status:', err);
      setError('Failed to update verification status');
    } finally {
      setUpdating(false);
    }
  };

  // Open document viewer modal
  const openDocumentModal = (document) => {
    setSelectedDocument(document);
    setIsModalOpen(true);
  };

  // Get all document types with their status
  const getAllDocumentsStatus = () => {
    return Object.entries(documentTypes).map(([type, config]) => {
      const uploadedDoc = documents.find(doc => doc.documentType === type);
      return {
        type,
        config,
        document: uploadedDoc,
        status: uploadedDoc ? uploadedDoc.status : 'missing',
        verificationStatus: uploadedDoc?.verificationStatus || 'pending'
      };
    });
  };

  if (loading) {
    return (
      <Box padding={4}>
        <Flex justifyContent="center">
          <Loader>Loading compliance documents...</Loader>
        </Flex>
      </Box>
    );
  }

  if (error) {
    return (
      <Box padding={4}>
        <Alert variant="danger" title="Error">
          {error}
        </Alert>
      </Box>
    );
  }

  const allDocuments = getAllDocumentsStatus();
  const uploadedCount = allDocuments.filter(doc => doc.status === 'uploaded').length;
  const verifiedCount = allDocuments.filter(doc => doc.verificationStatus === 'verified').length;
  const pendingCount = allDocuments.filter(doc => doc.verificationStatus === 'pending' && doc.status === 'uploaded').length;

  return (
    <Box>
      {/* Summary Statistics */}
      <Card marginBottom={4}>
        <CardHeader>
          <Typography variant="beta">Compliance Documents Overview</Typography>
        </CardHeader>
        <CardBody>
          <Grid gap={4}>
            <GridItem col={3}>
              <Box textAlign="center">
                <Typography variant="alpha" color="success600">{uploadedCount}</Typography>
                <Typography variant="pi" color="neutral600">Uploaded</Typography>
              </Box>
            </GridItem>
            <GridItem col={3}>
              <Box textAlign="center">
                <Typography variant="alpha" color="success600">{verifiedCount}</Typography>
                <Typography variant="pi" color="neutral600">Verified</Typography>
              </Box>
            </GridItem>
            <GridItem col={3}>
              <Box textAlign="center">
                <Typography variant="alpha" color="warning600">{pendingCount}</Typography>
                <Typography variant="pi" color="neutral600">Pending Review</Typography>
              </Box>
            </GridItem>
            <GridItem col={3}>
              <Box textAlign="center">
                <Typography variant="alpha" color="danger600">{Object.keys(documentTypes).length - uploadedCount}</Typography>
                <Typography variant="pi" color="neutral600">Missing</Typography>
              </Box>
            </GridItem>
          </Grid>
        </CardBody>
      </Card>

      {/* Documents Grid */}
      <Grid gap={4}>
        {allDocuments.map(({ type, config, document, status, verificationStatus }) => {
          const statusBadge = getStatusBadge(status, verificationStatus);
          
          return (
            <GridItem key={type} col={6}>
              <Card
                style={{ 
                  cursor: document ? 'pointer' : 'default',
                  opacity: status === 'missing' ? 0.6 : 1
                }}
                onClick={() => document && openDocumentModal(document)}
              >
                <CardBody padding={4}>
                  <Flex justifyContent="space-between" alignItems="flex-start">
                    <Box>
                      <Typography variant="delta" marginBottom={1}>
                        {config.name}
                      </Typography>
                      {config.required && (
                        <Badge variant="secondary" size="S">Required</Badge>
                      )}
                      {document && (
                        <Box marginTop={2}>
                          <Typography variant="pi" color="neutral600">
                            Uploaded: {new Date(document.uploadedAt).toLocaleDateString()}
                          </Typography>
                          {document.expiryDate && (
                            <Typography variant="pi" color="neutral600">
                              Expires: {new Date(document.expiryDate).toLocaleDateString()}
                            </Typography>
                          )}
                        </Box>
                      )}
                    </Box>
                    <Box>
                      <Badge variant={statusBadge.variant}>
                        {statusBadge.text}
                      </Badge>
                      {document && (
                        <Box marginTop={2}>
                          <Flex gap={2}>
                            <Button
                              variant="tertiary"
                              size="S"
                              startIcon={<Eye />}
                              onClick={(e) => {
                                e.stopPropagation();
                                openDocumentModal(document);
                              }}
                            >
                              View
                            </Button>
                          </Flex>
                        </Box>
                      )}
                    </Box>
                  </Flex>
                </CardBody>
              </Card>
            </GridItem>
          );
        })}
      </Grid>

      {/* Document Viewer Modal */}
      {isModalOpen && selectedDocument && (
        <Modal onClose={() => setIsModalOpen(false)}>
          <ModalLayout>
            <ModalHeader>
              <Typography variant="beta">
                Document Review: {documentTypes[selectedDocument.documentType]?.name}
              </Typography>
            </ModalHeader>
            <ModalBody>
              <Box>
                {/* Document Information */}
                <Grid gap={4} marginBottom={4}>
                  <GridItem col={6}>
                    <Typography variant="sigma" color="neutral600">Document Name:</Typography>
                    <Typography variant="epsilon">{selectedDocument.documentName}</Typography>
                  </GridItem>
                  <GridItem col={6}>
                    <Typography variant="sigma" color="neutral600">File Name:</Typography>
                    <Typography variant="epsilon">{selectedDocument.originalFileName}</Typography>
                  </GridItem>
                  <GridItem col={6}>
                    <Typography variant="sigma" color="neutral600">Upload Date:</Typography>
                    <Typography variant="epsilon">
                      {new Date(selectedDocument.uploadedAt).toLocaleDateString()}
                    </Typography>
                  </GridItem>
                  <GridItem col={6}>
                    <Typography variant="sigma" color="neutral600">File Size:</Typography>
                    <Typography variant="epsilon">
                      {(selectedDocument.fileSize / 1024).toFixed(1)} KB
                    </Typography>
                  </GridItem>
                  {selectedDocument.issueDate && (
                    <GridItem col={6}>
                      <Typography variant="sigma" color="neutral600">Issue Date:</Typography>
                      <Typography variant="epsilon">
                        {new Date(selectedDocument.issueDate).toLocaleDateString()}
                      </Typography>
                    </GridItem>
                  )}
                  {selectedDocument.expiryDate && (
                    <GridItem col={6}>
                      <Typography variant="sigma" color="neutral600">Expiry Date:</Typography>
                      <Typography variant="epsilon">
                        {new Date(selectedDocument.expiryDate).toLocaleDateString()}
                      </Typography>
                    </GridItem>
                  )}
                </Grid>

                {/* Current Status */}
                <Box marginBottom={4}>
                  <Typography variant="sigma" color="neutral600">Current Status:</Typography>
                  <Box marginTop={1}>
                    <Badge variant={getStatusBadge(selectedDocument.status, selectedDocument.verificationStatus).variant}>
                      {getStatusBadge(selectedDocument.status, selectedDocument.verificationStatus).text}
                    </Badge>
                  </Box>
                </Box>

                {/* Document Preview/Download */}
                <Box marginBottom={4}>
                  <Typography variant="sigma" color="neutral600" marginBottom={2}>Document:</Typography>
                  <Card>
                    <CardBody padding={4}>
                      <Flex justifyContent="center" alignItems="center" direction="column">
                        <FileText size="3rem" color="neutral500" />
                        <Typography variant="delta" marginTop={2} marginBottom={2}>
                          {selectedDocument.originalFileName}
                        </Typography>
                        <Button
                          variant="secondary"
                          startIcon={<Download />}
                          onClick={() => window.open(selectedDocument.s3Url, '_blank')}
                        >
                          Download & Review Document
                        </Button>
                      </Flex>
                    </CardBody>
                  </Card>
                </Box>

                {/* Verification History */}
                {selectedDocument.verifiedBy && (
                  <Box marginBottom={4}>
                    <Typography variant="sigma" color="neutral600">Verification History:</Typography>
                    <Typography variant="pi">
                      Verified by: {selectedDocument.verifiedBy}
                    </Typography>
                    {selectedDocument.verifiedAt && (
                      <Typography variant="pi">
                        Date: {new Date(selectedDocument.verifiedAt).toLocaleString()}
                      </Typography>
                    )}
                    {selectedDocument.notes && (
                      <Typography variant="pi">
                        Notes: {selectedDocument.notes}
                      </Typography>
                    )}
                  </Box>
                )}
              </Box>
            </ModalBody>
            <ModalFooter>
              <Flex gap={2}>
                <Button variant="tertiary" onClick={() => setIsModalOpen(false)}>
                  Close
                </Button>
                {selectedDocument.verificationStatus !== 'verified' && (
                  <Button
                    variant="success"
                    startIcon={<Check />}
                    onClick={() => handleVerification(selectedDocument.id, 'verified')}
                    loading={updating}
                  >
                    Verify Document
                  </Button>
                )}
                {selectedDocument.verificationStatus !== 'rejected' && (
                  <Button
                    variant="danger"
                    startIcon={<X />}
                    onClick={() => handleVerification(selectedDocument.id, 'rejected')}
                    loading={updating}
                  >
                    Reject Document
                  </Button>
                )}
                {selectedDocument.verificationStatus !== 'pending' && (
                  <Button
                    variant="secondary"
                    startIcon={<AlertTriangle />}
                    onClick={() => handleVerification(selectedDocument.id, 'pending')}
                    loading={updating}
                  >
                    Reset to Pending
                  </Button>
                )}
              </Flex>
            </ModalFooter>
          </ModalLayout>
        </Modal>
      )}
    </Box>
  );
};

export default ComplianceDocumentsView;
