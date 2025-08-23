import { Link } from "react-router-dom"

export default function Home() {
  return (
    <>
      <section className="home-grid">
        <h1 className="heading">quick options</h1>
        <div className="box-container">
          <div className="box">
            <h3 className="title">현재 수강중인 강좌</h3>
            <p className="likes"><span>리버싱싱</span></p>
            <a href="#" className="inline-btn">view more</a>
            <p className="likes"><span>웹심</span></p>
            <a href="#" className="inline-btn">view more</a>
          </div>

          <div className="box">
            <h3 className="title">공지사항</h3>
            <div className="notice-box">
              <a href="/notifications"><span>•MSG CTF 대회 안내</span></a>
              <a href="/notifications"><span>•학기말 프로젝트 발표회</span></a>
              <a href="/notifications"><span>•앱 버전 2.1.0 출시</span></a>
              <a href="/notifications"><span>•동아리 운영 방침</span></a>
            </div>
          </div>

          <div className="box">
            <h3 className="title">마이페이지</h3>
            <div className="flex">
              <Link to="/profile" className="quick-profile"><i className="fa-solid fa-user"></i><span>프로필</span></Link>
            </div>
          </div>
        </div>
      </section>

      <section className="courses">
        <h1 className="heading">our courses</h1>
        <div className="box-container">
          <div className="box">
            <div className="tutor">
              <img src="/images/pic-2.jpg" alt="" />
              <div className="info">
                <h3>리버싱크대나무행주</h3>
                <span>한우혁</span>
              </div>
            </div>
            <div className="thumb">
              <img src="/images/thumb-1.png" alt="" />
            </div>
            <h3 className="title">리버싱크대나무행주</h3>
            <a href="#" className="inline-btn">자세히 보기</a>
          </div>
        </div>

        <div className="more-btn">
          <Link to="/courses" className="inline-option-btn">view all courses</Link>
        </div>
      </section>
    </>
  )
}
