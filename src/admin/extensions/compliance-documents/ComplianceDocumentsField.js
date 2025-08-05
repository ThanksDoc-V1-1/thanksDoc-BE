import React from 'react';
import { useFormikContext } from '@strapi/helper-plugin';
import ComplianceDocumentsView from './ComplianceDocumentsView.js';
import { Box, Typography } from '@strapi/design-system';

const ComplianceDocumentsField = ({ name, ...props }) => {
  const { values } = useFormikContext();
  const doctorId = values.id;

  if (!doctorId) {
    return (
      <Box padding={4} textAlign="center">
        <Typography variant="epsilon" color="neutral600">
          Save the doctor profile first to view compliance documents
        </Typography>
      </Box>
    );
  }

  return <ComplianceDocumentsView doctorId={doctorId} />;
};

export default ComplianceDocumentsField;
