"""
Servicio de Generación de Recetas Médicas PDF
Genera recetas profesionales en formato A5 usando ReportLab
"""

from reportlab.lib.pagesizes import A5, landscape
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm, cm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
from reportlab.platypus.flowables import HRFlowable
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
import io
import base64
from datetime import datetime
from typing import Dict, List, Optional
import logging



logger = logging.getLogger(__name__)

class PrescriptionPDFService:
    """Servicio para generar recetas médicas en PDF formato A5"""
    
    def __init__(self):
        self.page_size = A5  # 148 x 210 mm
        self.margins = {
            'top': 15*mm,
            'bottom': 15*mm,
            'left': 10*mm,
            'right': 10*mm
        }
        
    def generate_prescription_pdf(self, prescription_data: Dict) -> bytes:
        """
        Genera un PDF de receta médica profesional
        
        Args:
            prescription_data: Diccionario con datos de la receta
            
        Returns:
            bytes: Contenido del PDF generado
        """
        try:
            # Buffer para el PDF
            buffer = io.BytesIO()
            
            # Crear documento
            doc = SimpleDocTemplate(
                buffer,
                pagesize=self.page_size,
                topMargin=self.margins['top'],
                bottomMargin=self.margins['bottom'],
                leftMargin=self.margins['left'],
                rightMargin=self.margins['right']
            )
            
            # Construir contenido
            story = []
            styles = self._get_custom_styles()
            
            # Header del hospital
            story.extend(self._build_header(prescription_data, styles))
            
            # Información del paciente
            story.extend(self._build_patient_info(prescription_data, styles))
            
            # Lista de medicamentos
            story.extend(self._build_medications_list(prescription_data, styles))
            
            # Footer con fecha y firma
            story.extend(self._build_footer(prescription_data, styles))
            
            # Generar PDF
            doc.build(story)
            
            # Obtener contenido
            pdf_content = buffer.getvalue()
            buffer.close()
            
            logger.info(f"PDF generado exitosamente: Receta N° {prescription_data.get('number', 'N/A')}")
            return pdf_content
            
        except Exception as e:
            logger.error(f"Error generando PDF de receta: {e}")
            raise
    
    def _get_custom_styles(self):
        """Crear estilos personalizados para la receta"""
        styles = getSampleStyleSheet()
        
        # Estilo para el título del hospital
        styles.add(ParagraphStyle(
            name='HospitalTitle',
            parent=styles['Title'],
            fontSize=14,
            fontName='Helvetica-Bold',
            alignment=TA_CENTER,
            textColor=colors.HexColor('#2c5aa0'),
            spaceAfter=3*mm
        ))
        
        # Estilo para información del hospital
        styles.add(ParagraphStyle(
            name='HospitalInfo',
            parent=styles['Normal'],
            fontSize=8,
            fontName='Helvetica',
            alignment=TA_CENTER,
            textColor=colors.black,
            spaceAfter=2*mm
        ))
        
        # Estilo para número de receta
        styles.add(ParagraphStyle(
            name='PrescriptionNumber',
            parent=styles['Normal'],
            fontSize=10,
            fontName='Helvetica-Bold',
            alignment=TA_RIGHT,
            textColor=colors.HexColor('#e74c3c'),
            spaceAfter=5*mm
        ))
        
        # Estilo para etiquetas
        styles.add(ParagraphStyle(
            name='FieldLabel',
            parent=styles['Normal'],
            fontSize=9,
            fontName='Helvetica-Bold',
            alignment=TA_LEFT,
            textColor=colors.black
        ))
        
        # Estilo para valores
        styles.add(ParagraphStyle(
            name='FieldValue',
            parent=styles['Normal'],
            fontSize=9,
            fontName='Helvetica',
            alignment=TA_LEFT,
            textColor=colors.black
        ))
        
        # Estilo para medicamentos
        styles.add(ParagraphStyle(
            name='MedicationItem',
            parent=styles['Normal'],
            fontSize=9,
            fontName='Helvetica',
            alignment=TA_LEFT,
            textColor=colors.black,
            leftIndent=5*mm,
            spaceAfter=2*mm
        ))
        
        # Estilo para dosificación
        styles.add(ParagraphStyle(
            name='Dosage',
            parent=styles['Normal'],
            fontSize=8,
            fontName='Helvetica-Oblique',
            alignment=TA_LEFT,
            textColor=colors.HexColor('#4b5563'),
            leftIndent=8*mm,
            spaceAfter=3*mm
        ))
        
        return styles
    
    def _build_header(self, prescription_data: Dict, styles) -> List:
        """Construir header del hospital"""
        story = []
        
        # Título del hospital
        hospital_name = prescription_data.get('hospital_info', {}).get('name', 'HOSPITAL CENTRAL SAN JOSÉ')
        story.append(Paragraph(hospital_name, styles['HospitalTitle']))
        
        # Información del hospital
        hospital_info = [
            "MINISTERIO DE SALUD",
            "INSTITUTO NACIONAL DE CIENCIAS NEUROLÓGICAS",
            "Jr. Ancash 1271 Cercado de Lima",
            "Teléf. 4117700"
        ]
        
        for info in hospital_info:
            story.append(Paragraph(info, styles['HospitalInfo']))
        
        # Número de receta
        prescription_number = prescription_data.get('number', '000000')
        story.append(Paragraph(f"RECETA ÚNICA ESTANDARIZADA N° {prescription_number}", styles['PrescriptionNumber']))
        
        # Línea separadora
        story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#e5e7eb')))
        story.append(Spacer(1, 3*mm))
        
        return story
    
    def _build_patient_info(self, prescription_data: Dict, styles) -> List:
        """Construir información del paciente"""
        story = []
        patient = prescription_data.get('patient', {})
        
        # Crear tabla para información del paciente
        patient_data = [
            [
                Paragraph("NOMBRES Y APELLIDOS:", styles['FieldLabel']),
                Paragraph(patient.get('name', '___________________'), styles['FieldValue'])
            ],
            [
                Paragraph("ATENCIÓN:", styles['FieldLabel']),
                ""
            ],
            [
                Paragraph("☐ Consulta Externa", styles['FieldValue']),
                Paragraph("☐ Emergencia", styles['FieldValue'])
            ],
            [
                Paragraph("☐ UCI", styles['FieldValue']),
                Paragraph("☐ Inter. Quirúrgicas", styles['FieldValue'])  
            ],
            [
                Paragraph("☒ Hospitalización", styles['FieldValue']),
                ""
            ]
        ]
        
        # Información adicional del paciente
        additional_info = [
            [
                Paragraph(f"Cama: {patient.get('bed', '_____')}", styles['FieldValue']),
                Paragraph(f"Sala: {patient.get('room', '_____')}", styles['FieldValue']),
                Paragraph(f"Edad: {patient.get('age', '__')} años", styles['FieldValue'])
            ]
        ]
        
        # Tabla principal de paciente
        patient_table = Table(patient_data, colWidths=[40*mm, 80*mm])
        patient_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 2*mm),
        ]))
        
        # Tabla de información adicional
        additional_table = Table(additional_info, colWidths=[35*mm, 35*mm, 35*mm])
        additional_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('FONTSIZE', (0, 0), (-1, -1), 8),
            ('BOX', (0, 0), (-1, -1), 0.5, colors.black),
            ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.black),
            ('TOPPADDING', (0, 0), (-1, -1), 1*mm),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 1*mm),
        ]))
        
        story.append(patient_table)
        story.append(Spacer(1, 2*mm))
        story.append(additional_table)
        story.append(Spacer(1, 5*mm))
        
        return story
    
    def _build_medications_list(self, prescription_data: Dict, styles) -> List:
        """Construir lista de medicamentos"""
        story = []
        medications = prescription_data.get('medications', [])
        
        # Título de sección
        story.append(Paragraph("DIAGNÓSTICO:", styles['FieldLabel']))
        story.append(Spacer(1, 2*mm))
        
        # Línea para diagnóstico
        story.append(HRFlowable(width="100%", thickness=0.5, color=colors.black))
        story.append(Spacer(1, 3*mm))
        
        # Encabezado de medicamentos
        story.append(Paragraph("MEDICAMENTO (DCI) / CONCENTRACIÓN", styles['FieldLabel']))
        story.append(Spacer(1, 2*mm))
        
        # Crear tabla para medicamentos
        if medications:
            med_data = []
            
            for i, med in enumerate(medications, 1):
                # Información del medicamento
                med_info = f"DCI: {med.get('name', 'N/A')} - {med.get('concentration', 'N/A')}\nCOMERCIAL (opcional): {med.get('form', '')}"
                
                # Dosificación
                dosage = med.get('dosage', 'Sin indicaciones')
                
                med_data.append([
                    Paragraph(med_info, styles['FieldValue']),
                    Paragraph(dosage, styles['FieldValue'])
                ])
                
                # Agregar líneas vacías para más medicamentos
                if i < 4:  # Máximo 4 medicamentos por receta
                    med_data.append([
                        Paragraph("DCI: _______________\nCOMERCIAL (opcional): _______________", styles['FieldValue']),
                        Paragraph("", styles['FieldValue'])
                    ])
            
            # Completar con líneas vacías si hay menos de 4 medicamentos
            while len(med_data) < 8:  # 4 medicamentos x 2 líneas cada uno
                med_data.append([
                    Paragraph("DCI: _______________\nCOMERCIAL (opcional): _______________", styles['FieldValue']),
                    Paragraph("", styles['FieldValue'])
                ])
        else:
            # Receta vacía con líneas para llenar
            med_data = []
            for _ in range(4):
                med_data.append([
                    Paragraph("DCI: _______________\nCOMERCIAL (opcional): _______________", styles['FieldValue']),
                    Paragraph("", styles['FieldValue'])
                ])
                med_data.append([
                    Paragraph("", styles['FieldValue']),
                    Paragraph("", styles['FieldValue'])
                ])
        
        # Crear tabla de medicamentos
        medications_table = Table(med_data, colWidths=[65*mm, 60*mm])
        medications_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('FONTSIZE', (0, 0), (-1, -1), 8),
            ('BOX', (0, 0), (-1, -1), 0.5, colors.black),
            ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.black),
            ('TOPPADDING', (0, 0), (-1, -1), 2*mm),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 2*mm),
            ('LEFTPADDING', (0, 0), (-1, -1), 2*mm),
            ('RIGHTPADDING', (0, 0), (-1, -1), 2*mm),
        ]))
        
        story.append(medications_table)
        story.append(Spacer(1, 5*mm))
        
        return story
    
    def _build_footer(self, prescription_data: Dict, styles) -> List:
        """Construir footer con fecha y firma"""
        story = []
        
        # Fecha
        current_date = datetime.now().strftime("%d.%m.%Y")
        
        footer_data = [
            [
                Paragraph(f"FECHA: {current_date}", styles['FieldLabel']),
                Paragraph("RECETA VÁLIDA POR: ____________", styles['FieldLabel'])
            ],
            [
                Paragraph("PRÓXIMO CONTROL: ____________", styles['FieldLabel']),
                ""
            ]
        ]
        
        footer_table = Table(footer_data, colWidths=[65*mm, 60*mm])
        footer_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('TOPPADDING', (0, 0), (-1, -1), 1*mm),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 1*mm),
        ]))
        
        story.append(footer_table)
        story.append(Spacer(1, 8*mm))
        
        # Área de firma
        signature_data = [
            [
                "",
                Paragraph("_________________________", styles['FieldValue'])
            ],
            [
                "",
                Paragraph("Firma y Sello del Médico", styles['FieldLabel'])
            ]
        ]
        
        signature_table = Table(signature_data, colWidths=[65*mm, 60*mm])
        signature_table.setStyle(TableStyle([
            ('ALIGN', (1, 0), (1, -1), 'CENTER'),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
        ]))
        
        story.append(signature_table)
        
        # Información legal
        story.append(Spacer(1, 3*mm))
        legal_text = "LLENAR EL RECETARIO CORRECTAMENTE SEGÚN R.M. N° 192-2008/MINSA"
        story.append(Paragraph(legal_text, styles['HospitalInfo']))
        
        return story
    
    def save_prescription_record(self, prescription_data: Dict) -> str:
        """
        Guardar registro de la receta en la base de datos
        
        Args:
            prescription_data: Datos de la receta
            
        Returns:
            str: ID del registro guardado
        """
        try:
            # Aquí iría la lógica para guardar en base de datos
            # Por ahora solo registramos el log
            
            prescription_id = f"RX_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{prescription_data.get('patient', {}).get('bed', 'XXX')}"
            
            logger.info(f"Receta guardada: {prescription_id}")
            logger.info(f"Paciente: {prescription_data.get('patient', {}).get('name', 'N/A')}")
            logger.info(f"Medicamentos: {len(prescription_data.get('medications', []))}")
            
            return prescription_id
            
        except Exception as e:
            logger.error(f"Error guardando registro de receta: {e}")
            raise

# Instancia global del servicio
prescription_service = PrescriptionPDFService()