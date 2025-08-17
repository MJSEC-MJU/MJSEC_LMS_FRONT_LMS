export default function Login() {
  return (
    <section className="form-container">
      <form action="" method="post" encType="multipart/form-data">
        <div className="logo-header">
          <img src="/logo.png" alt="로고" className="logo-image" />
          <h3>MJSEC LMS</h3>
        </div>
        <input type="text" name="student-no" placeholder="ID(학번)" required maxLength={50} className="box" />
        <input type="password" name="pass" placeholder="비밀번호" required maxLength={20} className="box" />
        <input type="submit" value="로그인" name="submit" className="btn" />
        <p><a href="/register">회원가입</a></p>
        <p><a href="/forgot-password">비밀번호 찾기</a></p>
      </form>
    </section>
  )
}
