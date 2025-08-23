import React from 'react';
import { Link } from 'react-router-dom';

export default function Unauthorized() {
  return (
    <section className="message">
      <div className="box">
        <p>401 Unauthorized</p>
        <h3>관리자 권한이 없습니다!</h3>
      </div>
    </section>
  );
}
