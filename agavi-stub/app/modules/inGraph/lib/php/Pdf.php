<?php

/**
 * Pdf class
 */

require_once dirname(dirname(__FILE__)) . '/vendor/FPDF/fpdf.php';

/**
 * This class will create PDFs for inGraph - still under HEAVVY construction
 *
 * @copyright  Copyright (c) 2011 Netways GmbH <support@netways.de>
 * @author     Thomas Gelf <thomas@gelf.net>
 * @package    Mocoli_inGraph
 * @license    http://www.gnu.org/copyleft/gpl.html GNU General Public License
 */
class Pdf extends FPDF
{
    /**
     * PNG stream handler for PNG to avoid disk usage
     *
     * @return void
     */
    public function addPngStream($fh, $name)
    {
        $info = $this->_parsepngstream($fh, $name);
        $info['i'] = count($this->images) + 1;
        $this->images[$name] = $info;
        $this->Image($name);
    }

    /**
     * Quick & dirty header
     *
     * @return void
     */
    public function header()
    {
        $title = 'inGraph';
        // Logo
        // $this->Image('logo.png', 10, 6, 30);
        // Arial bold 15
        $this->SetFont('Arial', 'B', 15);
        // Move to the right
        $this->Cell(80);
        // Title
        $this->Cell(30, 10, $title, 1, 0, 'C');
        // Line break
        $this->Ln(20);
    }

    /**
     * Quick & dirty header
     *
     * @return void
     */
    public function footer()
    {
        // Position at 1.5 cm from bottom
        $this->SetY(-15);
        // Arial italic 8
        $this->SetFont('Arial','I',8);
        // Page number
        $this->Cell(0, 10, 'Page ' . $this->PageNo() . '/{nb}', 0, 0, 'C');
    }
}

