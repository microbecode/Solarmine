import { Col, Container, Row } from "react-bootstrap";

import "../../styles/footer.scss";

export function Footer() {
  return (
    <footer className="footer-container">
      <Container fluid className="px-5">
        <Row className="m-0">
          <Col xs={12} md={6} lg={4}>
            <Row className="footer-logo justify-content-left"></Row>
          </Col>
          <Col xs={12} md={6} lg={4} className="mt-4 mt-md-0">
            <Row className="justify-content-center"></Row>
          </Col>
        </Row>
      </Container>
    </footer>
  );
}
